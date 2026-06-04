import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type AppLanguage = "English" | "Hindi" | "Kannada" | "Tamil" | "Telugu";

type LanguageContextValue = {
  selectedLanguage: AppLanguage;
  setSelectedLanguage: (language: AppLanguage) => void;
};

const DEFAULT_LANGUAGE: AppLanguage = "English";
const STORAGE_KEY = "manas360.selectedLanguage";

const VALID_LANGUAGES: readonly AppLanguage[] = ["English", "Hindi", "Kannada", "Tamil", "Telugu"];

const languageToHtmlLang: Record<AppLanguage, string> = {
  English: "en",
  Hindi: "hi",
  Kannada: "kn",
  Tamil: "ta",
  Telugu: "te",
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const isValidLanguage = (value: string): value is AppLanguage => {
  return VALID_LANGUAGES.includes(value as AppLanguage);
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedLanguage, setSelectedLanguage] = useState<AppLanguage>(() => {
    if (typeof window === "undefined") return DEFAULT_LANGUAGE;
    const stored = String(window.localStorage.getItem(STORAGE_KEY) || "").trim();
    return stored && isValidLanguage(stored) ? stored : DEFAULT_LANGUAGE;
  });

  useEffect(() => {
    if (!isValidLanguage(selectedLanguage)) {
      setSelectedLanguage(DEFAULT_LANGUAGE);
    }
  }, [selectedLanguage]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, selectedLanguage);
  }, [selectedLanguage]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.setAttribute("lang", languageToHtmlLang[selectedLanguage] ?? "en");
    root.setAttribute("data-app-language", selectedLanguage);
  }, [selectedLanguage]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      selectedLanguage,
      setSelectedLanguage,
    }),
    [selectedLanguage]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextValue => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
};
