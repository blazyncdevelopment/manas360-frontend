import { useEffect } from "react";
import { type AppLanguage, useLanguage } from "../../context/LanguageContext";
import { useLocation } from "react-router-dom";

declare global {
  interface Window {
    google?: {
      translate?: {
        TranslateElement?: new (
          options: Record<string, unknown>,
          elementId: string
        ) => unknown;
      };
    };
    __manasGoogleTranslateInit?: () => void;
    __manasGoogleTranslateLoaded?: boolean;
  }
}

const GOOGLE_SCRIPT_ID = "manas-google-translate-script";
const GOOGLE_CONTAINER_ID = "google_translate_element";
const DEFAULT_LANGUAGE_CODE = "en";

const languageToGoogleCode: Record<AppLanguage, string> = {
  English: "en",
  Hindi: "hi",
  Kannada: "kn",
  Tamil: "ta",
  Telugu: "te",
};

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

const getCandidateCookieDomains = (): string[] => {
  const host = String(window.location.hostname || "").trim();
  if (!host) return [];

  const hostParts = host.split(".").filter(Boolean);
  const domains = new Set<string>([host, `.${host}`]);
  for (let i = 0; i < hostParts.length; i += 1) {
    const domain = hostParts.slice(i).join(".");
    domains.add(domain);
    domains.add(`.${domain}`);
  }
  return Array.from(domains);
};

const getGoogTransCookieValue = (): string => {
  const parts = String(document.cookie || "")
    .split(";")
    .map((value) => value.trim())
    .filter(Boolean);

  for (const part of parts) {
    if (part.toLowerCase().startsWith("googtrans=")) {
      return decodeURIComponent(part.slice("googtrans=".length));
    }
  }

  return "";
};

const setGoogleTranslateCookie = (languageCode: string): void => {
  const cookieValue = `/${DEFAULT_LANGUAGE_CODE}/${languageCode}`;
  document.cookie = `googtrans=${cookieValue}; path=/`;
  for (const domain of getCandidateCookieDomains()) {
    document.cookie = `googtrans=${cookieValue}; path=/; domain=${domain}`;
  }
};

const ensureGoogleTranslateScript = (): Promise<void> => {
  if (window.__manasGoogleTranslateLoaded && window.google?.translate?.TranslateElement) {
    return Promise.resolve();
  }

  const existingScript = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null;
  if (existingScript) {
    return new Promise((resolve, reject) => {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Failed to load Google Translate script")), {
        once: true,
      });
    });
  }

  return new Promise((resolve, reject) => {
    window.__manasGoogleTranslateInit = () => {
      window.__manasGoogleTranslateLoaded = true;
      resolve();
    };

    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = "https://translate.google.com/translate_a/element.js?cb=__manasGoogleTranslateInit";
    script.async = true;
    script.onerror = () => reject(new Error("Failed to load Google Translate script"));
    document.body.appendChild(script);
  });
};

const ensureTranslatorMounted = (): void => {
  if (!window.google?.translate?.TranslateElement) {
    return;
  }

  const container = document.getElementById(GOOGLE_CONTAINER_ID);
  if (!container) {
    return;
  }

  if (container.childElementCount > 0) {
    return;
  }

  const TranslateElement = window.google.translate.TranslateElement;
  new TranslateElement(
    {
      pageLanguage: "en",
      includedLanguages: "en,hi,kn,ta,te",
      autoDisplay: false,
      layout: 0,
    },
    GOOGLE_CONTAINER_ID
  );
};

const selectGoogleLanguage = async (languageCode: string): Promise<void> => {
  const maxAttempts = 25;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const combo = document.querySelector<HTMLSelectElement>(".goog-te-combo");
    if (combo) {
      if (combo.value !== languageCode) {
        combo.value = languageCode;
        combo.dispatchEvent(new Event("change"));
      }
      return;
    }
    await wait(120);
  }
  console.warn("Google Translate combo not found after retries.");
};

const applyGoogleLanguage = async (language: AppLanguage): Promise<void> => {
  const languageCode = languageToGoogleCode[language];
  await ensureGoogleTranslateScript();
  ensureTranslatorMounted();
  await selectGoogleLanguage(languageCode);
  document.documentElement.setAttribute("lang", languageCode);

  // If user selects English, ensure we fully reset any prior translation artifacts.
  if (languageCode === DEFAULT_LANGUAGE_CODE) {
    document.documentElement.classList.remove("translated-ltr", "translated-rtl");
    document.body?.classList.remove("translated-ltr", "translated-rtl");
    document.documentElement.style.marginTop = "0px";
    if (document.body) {
      document.body.style.top = "0px";
    }
    if (window.location.hash.includes("googtrans")) {
      const cleanUrl = `${window.location.pathname}${window.location.search}`;
      window.history.replaceState(null, "", cleanUrl);
    }
  }
};

const ensureHiddenContainer = (): void => {
  if (document.getElementById(GOOGLE_CONTAINER_ID)) {
    return;
  }

  const container = document.createElement("div");
  container.id = GOOGLE_CONTAINER_ID;
  container.style.position = "fixed";
  container.style.bottom = "-9999px";
  container.style.left = "-9999px";
  container.style.opacity = "0";
  container.style.pointerEvents = "none";
  container.style.width = "0";
  container.style.height = "0";
  container.style.overflow = "hidden";
  container.setAttribute("aria-hidden", "true");
  document.body.appendChild(container);
};

const hideGoogleBanner = (): (() => void) => {
  const style = document.createElement("style");
  style.setAttribute("data-manas-google-translate-style", "true");
  style.textContent = `
    .goog-te-banner-frame,
    .goog-te-banner-frame.skiptranslate,
    iframe.goog-te-banner-frame,
    iframe.skiptranslate {
      display: none !important;
      visibility: hidden !important;
      height: 0 !important;
      min-height: 0 !important;
    }
    .skiptranslate iframe {
      display: none !important;
      visibility: hidden !important;
    }
    .goog-logo-link,
    .goog-te-gadget,
    .goog-te-gadget-simple,
    .goog-te-gadget-icon,
    .goog-te-menu-value,
    .goog-te-menu-value span,
    .goog-te-menu-value img {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      width: 0 !important;
      height: 0 !important;
      overflow: hidden !important;
    }
    #google_translate_element {
      display: block !important;
      opacity: 0 !important;
      pointer-events: none !important;
      width: 0 !important;
      height: 0 !important;
      overflow: hidden !important;
    }
    body { top: 0px !important; }
    html { margin-top: 0 !important; }
    #goog-gt-tt,
    .goog-te-balloon-frame {
      display: none !important;
    }
    .notranslate { translate: no; }
    font {
      background: transparent !important;
      box-shadow: none !important;
      position: static !important;
      display: inline !important;
      white-space: inherit !important;
      font-size: inherit !important;
      line-height: inherit !important;
      font-family: inherit !important;
    }
  `;
  document.head.appendChild(style);

  const removeInjectedBanners = () => {
    const selectors = [
      ".goog-te-banner-frame",
      "iframe.goog-te-banner-frame",
      "iframe.skiptranslate",
      "#goog-gt-tt",
      ".goog-te-balloon-frame",
    ];

    selectors.forEach((selector) => {
      document.querySelectorAll<HTMLElement>(selector).forEach((node) => {
        node.style.display = "none";
        node.style.visibility = "hidden";
        node.style.height = "0";
        node.style.minHeight = "0";
      });
    });

    document.documentElement.style.marginTop = "0";
    document.body.style.top = "0";
  };

  removeInjectedBanners();
  const observer = new MutationObserver(() => {
    removeInjectedBanners();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  return () => {
    observer.disconnect();
    style.remove();
  };
};

const GoogleTranslateController: React.FC = () => {
  const { selectedLanguage } = useLanguage();
  const location = useLocation();

  useEffect(() => {
    ensureHiddenContainer();
    const cleanupBannerStyle = hideGoogleBanner();
    return cleanupBannerStyle;
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const languageCode = languageToGoogleCode[selectedLanguage];
        setGoogleTranslateCookie(languageCode);

        // IMPORTANT: For English, do not mount/drive Google Translate at all.
        // If the page ends up auto-translated (usually from a stale cookie/state),
        // do one clean reload after forcing the cookie back to /en/en.
        if (languageCode === DEFAULT_LANGUAGE_CODE) {
          const resetFlagKey = "google-translate-english-reset-once";
          const translatedClassDetected =
            document.documentElement.classList.contains("translated-ltr") ||
            document.documentElement.classList.contains("translated-rtl") ||
            document.body?.classList.contains("translated-ltr") ||
            document.body?.classList.contains("translated-rtl");
          const cookieValue = getGoogTransCookieValue();
          const cookieForcesTranslation =
            Boolean(cookieValue) && cookieValue !== `/${DEFAULT_LANGUAGE_CODE}/${DEFAULT_LANGUAGE_CODE}`;
          const combo = document.querySelector<HTMLSelectElement>(".goog-te-combo");
          const comboForcesTranslation = Boolean(combo) && combo?.value !== DEFAULT_LANGUAGE_CODE;
          const looksTranslated = translatedClassDetected || cookieForcesTranslation || comboForcesTranslation;

          document.documentElement.setAttribute("lang", DEFAULT_LANGUAGE_CODE);

          // If Google Translate is already mounted (e.g. user switched from Hindi -> English),
          // actively switch the combo back to English so the page is reverted without requiring a reload.
          if (looksTranslated && (combo || window.google?.translate?.TranslateElement)) {
            await ensureGoogleTranslateScript();
            ensureTranslatorMounted();
            await selectGoogleLanguage(DEFAULT_LANGUAGE_CODE);
          }

          // Clean up any leftover banner/classes/margins.
          document.documentElement.classList.remove("translated-ltr", "translated-rtl");
          document.body?.classList.remove("translated-ltr", "translated-rtl");
          document.documentElement.style.marginTop = "0px";
          if (document.body) document.body.style.top = "0px";
          if (window.location.hash.includes("googtrans")) {
            const cleanUrl = `${window.location.pathname}${window.location.search}`;
            window.history.replaceState(null, "", cleanUrl);
          }

          const hasResetOnce = window.sessionStorage.getItem(resetFlagKey) === "true";
          if (looksTranslated && !hasResetOnce) {
            window.sessionStorage.setItem(resetFlagKey, "true");
            window.location.replace(`${window.location.pathname}${window.location.search}`);
            return;
          }

          if (hasResetOnce) {
            window.sessionStorage.removeItem(resetFlagKey);
          }

          return;
        }

        await applyGoogleLanguage(selectedLanguage);
        await wait(180);
        await applyGoogleLanguage(selectedLanguage);
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to apply language translation:", error);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [selectedLanguage, location.pathname]);

  return null;
};

export default GoogleTranslateController;
