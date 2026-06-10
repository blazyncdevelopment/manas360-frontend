import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useNavigate } from "react-router-dom";
import { MessageCircle, Instagram, Youtube, Linkedin, User } from "lucide-react";
import {
  applyTheme,
  getStoredThemePreference,
  resolveTheme,
  type ThemePreference,
} from "../lib/themePreference";
import { useLanguage } from "../context/LanguageContext";
import type { AuthUser } from "../api/auth";
import { getPostLoginRoute, useAuth } from "../context/AuthContext";

const logo = "/AppIcon.jpeg";

type LoginOption = {
  type: string;
  label: string;
  icon: string;
  desc: string;
};

type QuickNavMegaItem = {
  icon: string;
  title: string;
  subtitle: string;
  badge?: string;
};

type QuickNavMegaMenu = {
  accent: string;
  title: string;
  subtitle: string;
  columns: number;
  items: QuickNavMegaItem[];
};

const MEGA_ITEM_DEFAULT_BG = "rgba(255,255,255,0.98)";

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = hex.replace("#", "").trim();
  if (normalized.length !== 6) return null;
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return null;
  return { r, g, b };
}

/** Light tint of the parent nav accent for mega-menu item hover */
function accentHoverBackground(accent: string, mix = 0.14): string {
  const rgb = hexToRgb(accent);
  if (!rgb) return "#FAFCFF";
  const r = Math.round(rgb.r * mix + 255 * (1 - mix));
  const g = Math.round(rgb.g * mix + 255 * (1 - mix));
  const b = Math.round(rgb.b * mix + 255 * (1 - mix));
  return `rgb(${r}, ${g}, ${b})`;
}

function megaItemHoverHandlers(accent: string) {
  const hoverBg = accentHoverBackground(accent);
  return {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
      e.currentTarget.style.background = hoverBg;
    },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
      e.currentTarget.style.background = MEGA_ITEM_DEFAULT_BG;
    },
  };
}

export const landingHeaderStyles = `
        .landing-nav-shell {
          position: relative;
        }
        .landing-fixed-logo {
          position: absolute;
          left: 16px;
          top: 10px;
          z-index: 5;
          will-change: box-shadow;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
        }
        .landing-brand-text {
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 2px;
        }
        .landing-brand-name {
          font-size: 15px;
          font-weight: 900;
          color: #0B2D5E;
          letter-spacing: -0.2px;
          line-height: 1.15;
          font-family: "DM Sans", sans-serif;
          white-space: nowrap;
        }
        .landing-brand-tagline {
          font-size: 8px;
          font-weight: 700;
          color: #4A7C59;
          letter-spacing: 0.3px;
          text-transform: uppercase;
          white-space: nowrap;
          line-height: 1.2;
        }
        @media (max-width: 600px) {
          .landing-brand-tagline { display: none; }
          .landing-brand-name { font-size: 13px; }
        }
        .landing-sticky-header {
          isolation: isolate;
          flex-shrink: 0;
        }
        .landing-promo-bar {
          flex-shrink: 0;
          overflow: hidden;
          max-height: 76px;
          transition: max-height 0.25s ease, opacity 0.25s ease;
          position: relative;
          z-index: 2;
        }
        .landing-promo-bar--collapsed {
          max-height: 0;
          opacity: 0;
          pointer-events: none;
        }
        .landing-sticky-header:has(.landing-promo-bar--collapsed) {
          --landing-promo-offset: 0px;
        }
        .brand-bar {
          background: white;
          border-bottom: 1px solid transparent;
          position: relative;
          z-index: 1;
          flex-shrink: 0;
          contain: layout style;
          transition: background 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
        }
        .brand-bar-top-row {
          max-height: 52px;
          overflow: visible;
        }
        .landing-top-shortcut-btn > span:last-child {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 88px;
        }
        .brand-bar > div {
          padding-left: 216px;
        }
        @media (max-width: 600px) {
          .brand-bar > div {
            padding-left: 128px;
          }
        }
        .brand-bar.scrolled {
          background: rgba(255, 255, 255, 0.94);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border-bottom-color: #e2e8f0;
          box-shadow: 0 1px 10px rgba(0, 0, 0, 0.04);
        }
        .quick-nav-row {
          flex-shrink: 0;
          min-height: 52px;
        }
        .quick-nav-scroll {
          position: relative;
          flex: 1;
          min-width: 0;
        }
        .quick-nav {
          display: flex;
          align-items: center;
          gap: 4px;
          flex-wrap: nowrap;
          flex: 1;
          min-width: 0;
          max-width: 100%;
          height: 34px;
          white-space: nowrap;
          overflow: hidden;
        }
        .header-scroll-x {
          scrollbar-width: none;
          -ms-overflow-style: none;
          -webkit-overflow-scrolling: touch;
        }
        .header-scroll-x::-webkit-scrollbar {
          display: none;
        }
        .quick-nav-chip {
          color: #000000 !important;
          opacity: 1 !important;
          filter: none !important;
          -webkit-text-fill-color: #000000 !important;
          text-shadow: none !important;
          background: #ffffff !important;
        }
        .quick-nav-chip-icon,
        .quick-nav-chip-label {
          color: #000000 !important;
          opacity: 1 !important;
          filter: none !important;
          -webkit-text-fill-color: #000000 !important;
          text-shadow: none !important;
        }
        .landing-login-wrap {
          position: relative;
          flex-shrink: 0;
        }
        .landing-login-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 248px;
          z-index: 210;
          background: white;
          border-radius: 12px;
          box-shadow: 0 14px 50px rgba(0, 0, 0, 0.14);
          padding: 6px;
          border: 1px solid #E8EDF2;
        }
        .quick-nav-mega-panel {
          position: absolute;
          left: 0;
          right: 0;
          top: calc(100% + 10px);
          z-index: 170;
        }
        @media (max-width: 980px) {
          .landing-sticky-header {
            --landing-promo-offset: 44px;
          }
          .landing-sticky-header:has(.landing-promo-bar--collapsed) {
            --landing-promo-offset: 0px;
          }
          .landing-promo-bar {
            max-height: 44px;
            min-height: 44px;
          }
          .landing-promo-bar--collapsed {
            max-height: 0;
            min-height: 0;
          }
          .landing-promo-bar > div {
            padding-top: 8px !important;
            padding-bottom: 8px !important;
            gap: 8px !important;
          }
          .landing-promo-bar span:nth-of-type(3),
          .landing-promo-bar button:first-of-type {
            display: none;
          }
          .landing-page-root {
            --landing-section-gap: 48px;
          }
          .landing-fixed-logo {
            display: none !important;
          }
          .brand-bar {
            contain: none;
            overflow: visible;
          }
          .brand-bar > div {
            padding-left: 16px !important;
            overflow: visible;
            max-width: 100%;
          }
          .brand-bar-top-row {
            height: auto;
            min-height: 48px;
            max-height: 52px;
            flex-wrap: nowrap !important;
            justify-content: space-between !important;
            overflow: visible;
            gap: 8px !important;
            padding-top: 6px;
            padding-bottom: 6px;
            padding-right: 8px;
          }
          .brand-bar-top-leading {
            flex: 1 1 auto !important;
            flex-wrap: nowrap !important;
            min-width: 0;
            max-width: calc(100% - 148px);
            overflow-x: auto;
            overflow-y: hidden;
            -webkit-overflow-scrolling: touch;
            touch-action: pan-x;
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          .brand-bar-top-leading::-webkit-scrollbar {
            display: none;
          }
          .landing-brand-langs,
          .landing-top-shortcuts {
            flex-wrap: nowrap !important;
            flex-shrink: 0;
          }
          .landing-brand-langs button {
            padding: 5px 9px !important;
            font-size: 10px !important;
            flex-shrink: 0;
          }
          .landing-top-shortcuts button {
            flex-shrink: 0;
          }
          .landing-brand-actions {
            flex: 0 0 auto !important;
            flex-shrink: 0;
            margin-left: auto !important;
            min-width: max-content;
            position: relative;
            z-index: 30;
            padding-left: 8px;
            background: linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.92) 14%, #ffffff 28%);
          }
          .brand-bar.scrolled .landing-brand-actions {
            background: linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.94) 14%, rgba(255, 255, 255, 0.98) 28%);
          }
          .landing-brand-actions button,
          .landing-login-btn,
          .landing-profile-btn {
            min-height: 40px;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
          }
          .landing-profile-btn {
            width: 40px !important;
            height: 40px !important;
          }
          .landing-login-dropdown.landing-login-dropdown--mobile {
            position: fixed;
            right: 12px;
            width: min(280px, calc(100vw - 24px));
            max-height: min(70vh, 360px);
            overflow-y: auto;
            z-index: 2000;
          }
          .landing-search-btn {
            min-width: 0 !important;
            padding: 8px 10px !important;
          }
          .landing-search-btn span:nth-child(2),
          .landing-search-btn span:nth-child(3) {
            display: none;
          }
          .landing-subscribe-btn {
            padding: 8px 10px !important;
            font-size: 10px !important;
          }
          .landing-brand-socials {
            display: none !important;
          }
          .quick-nav-row {
            min-height: 48px;
            max-height: none;
            padding-top: 6px !important;
            padding-bottom: 8px !important;
            overflow: visible;
            justify-content: flex-start !important;
            padding-right: 8px;
            flex-direction: column;
            align-items: stretch;
            gap: 0;
          }
          .quick-nav-scroll {
            flex: 0 0 auto;
            min-width: 0;
            width: 100%;
            max-width: 100%;
            overflow-x: auto;
            overflow-y: hidden;
            -webkit-overflow-scrolling: touch;
            touch-action: pan-x;
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          .quick-nav-scroll::-webkit-scrollbar {
            display: none;
          }
          .quick-nav {
            overflow-x: visible;
            overflow-y: hidden;
            width: max-content;
            max-width: none;
            flex: 0 0 auto;
            min-height: 44px;
            align-items: center;
            flex-wrap: nowrap !important;
          }
          .quick-nav-chip {
            flex: 0 0 auto;
          }
          .quick-nav-chip-btn {
            min-height: 40px;
            padding: 8px 10px !important;
            touch-action: manipulation;
            -webkit-tap-highlight-color: rgba(11, 45, 94, 0.12);
            user-select: none;
            appearance: none;
            -webkit-appearance: none;
          }
          .quick-nav-mega-panel.quick-nav-mega-panel--mobile {
            position: fixed;
            left: 8px;
            right: 8px;
            width: auto;
            max-height: min(62vh, 480px);
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
            z-index: 1950;
          }
          .quick-nav-mega-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 980px) {
          .quick-nav-row.header-scroll-x {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
          .quick-nav-row.header-scroll-x::-webkit-scrollbar {
            display: none;
          }
        }
`;

function getUserInitial(user: AuthUser | null | undefined): string {
  const firstName = String(user?.firstName || "").trim();
  if (firstName) return firstName.charAt(0).toUpperCase();
  const lastName = String(user?.lastName || "").trim();
  if (lastName) return lastName.charAt(0).toUpperCase();
  const email = String(user?.email || "").trim();
  if (email) return email.charAt(0).toUpperCase();
  const phone = String(user?.phone || "").trim();
  if (phone) return phone.charAt(phone.length - 1).toUpperCase();
  return "";
}

export const HeaderPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const userInitial = useMemo(() => getUserInitial(user), [user]);
  const { selectedLanguage, setSelectedLanguage } = useLanguage();
  const [activeTheme, setActiveTheme] = useState<ThemePreference>(() => resolveTheme(getStoredThemePreference()));
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loginDropdownOpen, setLoginDropdownOpen] = useState(false);
  const [showTopPromo, setShowTopPromo] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeQuickNav, setActiveQuickNav] = useState<string | null>(null);
  const [loginDropdownTop, setLoginDropdownTop] = useState<number | null>(null);
  const [quickNavMegaTop, setQuickNavMegaTop] = useState<number | null>(null);
  const quickNavCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const quickNavTouchStart = useRef<{ x: number; y: number } | null>(null);
  const quickNavTouchHandled = useRef(false);
  const loginBtnRef = useRef<HTMLButtonElement>(null);
  const loginDropdownRef = useRef<HTMLDivElement>(null);
  const quickNavRowRef = useRef<HTMLDivElement>(null);
  const quickNavMegaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    applyTheme(activeTheme);
  }, [activeTheme]);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoginDropdownOpen(false);
    setLoginDropdownTop(null);
  }, [isAuthenticated]);

  useEffect(() => {
    const clearMobileAnchors = () => {
      if (window.innerWidth > 980) {
        setLoginDropdownTop(null);
        setQuickNavMegaTop(null);
      }
    };
    window.addEventListener("resize", clearMobileAnchors);
    return () => window.removeEventListener("resize", clearMobileAnchors);
  }, []);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme-preference') {
        setActiveTheme(resolveTheme(getStoredThemePreference()));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // FIX: Single scroll handler using React state only (no DOM class manipulation).
  // Wider hysteresis on mobile avoids oscillation when the header repaints.
  const handleScroll = useCallback(() => {
    setIsScrolled((prev) => {
      const isMobile = window.innerWidth <= 980;
      const scrolledEnterAt = isMobile ? 48 : 120;
      const scrolledExitAt = isMobile ? 8 : 60;
      if (!prev && window.scrollY > scrolledEnterAt) return true;
      if (prev && window.scrollY < scrolledExitAt) return false;
      return prev;
    });
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // FIX: Removed the DOM-based dedup useEffect entirely. It was an anti-pattern
  // that fought React's renderer: querying/removing DOM nodes that React owns
  // caused React to lose track of the brand bar, leading to it being re-inserted
  // on the next render — producing the visible double-navbar flash.

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowSearch(true);
      }
      if (e.key === "Escape") {
        setShowSearch(false);
        setLoginDropdownOpen(false);
        setLoginDropdownTop(null);
        setActiveQuickNav(null);
        setQuickNavMegaTop(null);
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, []);

  const loginRoutes: Record<string, string> = useMemo(
    () => ({
      patient: "/auth/login?userType=patient",
      therapist: "/auth/login?role=therapist",
      corporate: "/auth/login?next=/corporate/dashboard",
      clinic: "/auth/login?role=therapist",
    }),
    []
  );

  const handleLogin = (type: string) => {
    setLoginDropdownOpen(false);
    setLoginDropdownTop(null);
    navigate(loginRoutes[type] ?? `/auth/login?userType=${type}`);
  };

  const updateLoginDropdownPosition = useCallback(() => {
    if (!loginBtnRef.current || window.innerWidth > 980) {
      setLoginDropdownTop(null);
      return;
    }
    const rect = loginBtnRef.current.getBoundingClientRect();
    setLoginDropdownTop(rect.bottom + 8);
  }, []);

  const toggleLoginDropdown = useCallback(() => {
    setLoginDropdownOpen((open) => {
      const next = !open;
      if (!next) {
        setLoginDropdownTop(null);
        return next;
      }
      if (window.innerWidth <= 980) {
        requestAnimationFrame(updateLoginDropdownPosition);
      } else {
        setLoginDropdownTop(null);
      }
      return next;
    });
  }, [updateLoginDropdownPosition]);

  useEffect(() => {
    if (!loginDropdownOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        loginBtnRef.current?.contains(target) ||
        loginDropdownRef.current?.contains(target)
      ) {
        return;
      }
      setLoginDropdownOpen(false);
      setLoginDropdownTop(null);
    };

    const handleReposition = () => {
      if (window.innerWidth <= 980) updateLoginDropdownPosition();
    };

    document.addEventListener("click", handleOutsideClick);
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, { passive: true });

    return () => {
      document.removeEventListener("click", handleOutsideClick);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition);
    };
  }, [loginDropdownOpen, updateLoginDropdownPosition]);


  const handleHitASixerPromo = () => {
    navigate("/hit-a-sixer");
  };

  const megaItemRoutes: Record<string, string> = {
    "1-on-1 Therapy": "/premium-theraphy",
    "Psychiatry Consult": "/premium-theraphy",
    "Couples Therapy": "/find-spark",
    "Group Therapy": "/group-therapy",
    "Sound Therapy": "/sound-therapy",
    "Executive Coaching": "/premium-theraphy",
    "Wellness Retreats": "/retreats",
    "Free Screening": "/assessment",
    "Find a Therapist": "/helping-hand",
    "See a Psychiatrist": "/helping-hand",
    "Specialized Care": "/specialized-care",
    "Group Sessions": "/group-therapy",
    "Crisis Support": "/crisis",
    "Anytime Buddy AI": "/ai-power-hub",
    "AnytimeBuddy Chat": "/ai-power-hub",
    "Vent Buddy": "/ai-power-hub",
    "AI Session Notes": "/ai-power-hub",
<<<<<<< HEAD
    "Baby Dinosaur": "/patient/dino",
    "Golden Retriever": "/patient/goldenPup",
    "Healing Elephant": "/patient/elephant",
    "Chintu Fox": "/patient/chintu",
=======
    "Baby Dinosaur": "/dino",
    "Golden Retriever": "/goldenPup",
    "Healing Elephant": "/elephant",
    "Chintu Fox": "/chintu",
>>>>>>> 94cbd162f6615c2927072b3f82630100c9cfd9a6
    "Name Your Pet \u2014 Adopt": "/pet",
    "Mood Tracker": "/self-help",
    "Breathing Exercises": "/self-help",
    "Journaling Prompts": "/self-help",
    "Sleep Guide": "/self-help",
    "CBT Worksheets": "/self-help",
    "Find a Spark \u2014 Couples": "/find-spark",
    "Concerned Parent": "/find-spark",
    "Family Plan": "/find-spark",
    "Teen & Student": "/find-spark",
    "Corporate Wellness": "/corporate-landing",
    "Education Institutions": "/corporate-landing",
    "Healthcare Units": "/corporate-landing",
    "Government Agency": "/corporate-landing",
    "Certification Hub": "/certifications",
    "Join as Therapist": "/certifications",
    "Patient Database": "/my-digital-clinic",
    "Session Notes": "/my-digital-clinic",
    "Scheduling": "/my-digital-clinic",
    "Prescriptions": "/my-digital-clinic",
    "Progress Tracking": "/my-digital-clinic",
    "3 days": "/my-digital-clinic",
    "NRI Landing": "/nri-landing",
  };

  const menuFallbackRoutes: Record<string, string> = {
    "I Need a Helping Hand": "/helping-hand",
    "A I Power Hub": "/ai-power-hub",
    "Find a Spark Again": "/find-spark",
    "Self-Help Tools": "/self-help",
    "For Corporates / Edu / Healthcare": "/corporate-landing",
    "Premium Therapy Hub": "/premium-theraphy",
    "MyDigitalClinic": "/my-digital-clinic",
    "Certify 2 Earn More": "/certifications",
    "Digital Pets4Happy Hormones": "/pet",
    "NRI | Global Inc": "/nri-landing",
  };

  const handleMegaItemNav = (itemTitle: string, parentMenu: string | null) => {
    setActiveQuickNav(null);
    setQuickNavMegaTop(null);
    const route = megaItemRoutes[itemTitle] || (parentMenu ? menuFallbackRoutes[parentMenu] : null);
    if (route) navigate(route);
  };

  useEffect(() => {
    return () => {
      if (quickNavCloseTimer.current) {
        clearTimeout(quickNavCloseTimer.current);
      }
    };
  }, []);

  const loginOptions: LoginOption[] = useMemo(
    () => [
      { type: "patient", label: "Patient", icon: "\uD83E\uDDD1", desc: "Find therapy & healing" },
      { type: "therapist", label: "Therapist", icon: "\u2695\uFE0F", desc: "Join & earn" },
      { type: "corporate", label: "Corporate", icon: "\uD83C\uDFE2", desc: "Wellness programs" },
      { type: "clinic", label: "Clinic", icon: "\uD83C\uDFE5", desc: "Manage practice" }
    ],
    []
  );

  const quickNavItems: Array<{ icon: string; label: string }> = useMemo(
    () => [
      { icon: "\uD83E\uDD1D", label: "I Need a Helping Hand" },
      { icon: "\uD83D\uDC3E", label: "Digital Pets4Happy Hormones" },
      { icon: "\uD83E\uDDF0", label: "Self-Help Tools" },
      { icon: "\u2728", label: "Find a Spark Again" },
      { icon: "\uD83C\uDFDB\uFE0F", label: "For Corporates / Edu / Healthcare" },
      { icon: "\uD83C\uDF93", label: "Certify 2 Earn More" },
      { icon: "\uD83D\uDCCB", label: "MyDigitalClinic" },
      { icon: "\uD83C\uDF10", label: "NRI | Global Inc" }
    ],
    []
  );

  const topShortcutItems: Array<{ icon: string; label: string; route: string }> = useMemo(
    () => [
      { icon: "\uD83D\uDC8E", label: "Premium Therapy Hub", route: "/premium-theraphy" },
      { icon: "\u26A1", label: "AI Power Hub", route: "/ai-power-hub" },
    ],
    []
  );

  const quickNavMegaMenus: Record<string, QuickNavMegaMenu> = useMemo(
    () => ({
      "I Need a Helping Hand": {
        accent: "#16A34A",
        title: "I Need a Helping Hand",
        subtitle: "Start your healing journey",
        columns: 5,
        items: [
          { icon: "\uD83E\uDE7A", title: "Free Screening", subtitle: "2-min PHQ-9 mood assessment", badge: "Free" },
          { icon: "\uD83E\uDDE0", title: "Find a Therapist", subtitle: "Psychologists & counselors" },
          { icon: "\u2695\uFE0F", title: "See a Psychiatrist", subtitle: "Medication & diagnosis" },
          { icon: "\uD83C\uDFAF", title: "Specialized Care", subtitle: "OCD, PTSD, addiction, child" },
          { icon: "\uD83D\uDC65", title: "Group Sessions", subtitle: "Peer support from \u20B999", badge: "\u20B999" },
          { icon: "\uD83D\uDEA8", title: "Crisis Support", subtitle: "Immediate 24/7 help", badge: "SOS" }
        ]
      },
      "AI Power Hub": {
        accent: "#7C3AED",
        title: "AI Power Hub",
        subtitle: "AI-driven tools \u2014 24/7, no appointment needed",
        columns: 4,
        items: [
          { icon: "\uD83E\uDD16", title: "Anytime Buddy AI", subtitle: "Guidance from your AI companion", badge: "AI" },
          { icon: "\uD83D\uDCAC", title: "AnytimeBuddy Chat", subtitle: "24/7 text companion", badge: "24/7" },
          { icon: "\u2601\uFE0F", title: "Vent Buddy", subtitle: "Safe space to express feelings", badge: "Soon" },
          { icon: "\uD83D\uDCDD", title: "AI Session Notes", subtitle: "Claude-powered clinical summaries", badge: "Pro" }
        ]
      },
      "Digital Pets4Happy Hormones": {
        accent: "#F97316",
        title: "Digital Pets4Happy Hormones",
        subtitle: "4 pets, 4 hormones \u2014 nurture them, nurture you",
        columns: 5,
        items: [
          { icon: "\uD83E\uDD95", title: "Baby Dinosaur", subtitle: "Oxytocin \u2014 nurture, bond, feel loved", badge: "Love" },
          { icon: "\uD83D\uDC15", title: "Golden Retriever", subtitle: "Serotonin \u2014 daily routines, calm, stability", badge: "Happy" },
          { icon: "\uD83D\uDC18", title: "Healing Elephant", subtitle: "Dopamine \u2014 achievements, games, milestones", badge: "Reward" },
          { icon: "\uD83E\uDD8A", title: "Chintu Fox", subtitle: "Endorphins \u2014 breathwork, play, laughter", badge: "Energy" },
          { icon: "\uD83D\uDC9D", title: "Name Your Pet \u2014 Adopt", subtitle: "Choose, name, and start your journey", badge: "Free" }
        ]
      },
      "Premium Therapy Hub": {
        accent: "#0EA5A4",
        title: "Premium Therapy Hub",
        subtitle: "Clinically supervised, evidence-based sessions",
        columns: 5,
        items: [
          { icon: "🧠", title: "1-on-1 Therapy", subtitle: "Psychologist sessions from ₹699", badge: "₹699" },
          { icon: "⚕️", title: "Psychiatry Consult", subtitle: "Medication review from ₹999", badge: "₹999" },
          { icon: "💑", title: "Couples Therapy", subtitle: "Rebuild your relationship", badge: "₹1,499" },
          { icon: "👥", title: "Group Therapy", subtitle: "Peer circles from ₹149", badge: "₹149" },
          { icon: "🎵", title: "Sound Therapy", subtitle: "Raga healing + sleep tracks", badge: "20 Free" },
          { icon: "💼", title: "Executive Coaching", subtitle: "High-performance wellness", badge: "Pro" },
          { icon: "🏕️", title: "Wellness Retreats", subtitle: "Rishikesh, Coorg, Goa" },
          { icon: "🛒", title: "Wellness Shop", subtitle: "Journals, tools, merch", badge: "Soon" }
        ]
      },
      "Self-Help Tools": {
        accent: "#A16207",
        title: "Self-Help Tools",
        subtitle: "Free tools you can use right now \u2014 no login needed",
        columns: 5,
        items: [
          { icon: "\uD83D\uDCCA", title: "Mood Tracker", subtitle: "Track emotional trends daily", badge: "Free" },
          { icon: "\uD83C\uDFB5", title: "Sound Therapy", subtitle: "Calm sound-based relaxation", badge: "Free" },
          { icon: "\uD83C\uDF2C\uFE0F", title: "Breathing Exercises", subtitle: "4-7-8 \u2022 Box \u2022 Calm Breath \u2022 Guided sessions", badge: "Free" },
          { icon: "\uD83D\uDCD3", title: "Journaling Prompts", subtitle: "Daily reflection questions" },
          { icon: "\uD83C\uDF19", title: "Sleep Guide", subtitle: "Hygiene checklist + wind-down" },
          { icon: "\uD83D\uDCC4", title: "CBT Worksheets", subtitle: "Thought records & behavioral experiments", badge: "Free" }
        ]
      },
      "Find a Spark Again": {
        accent: "#E11D48",
        title: "Find a Spark Again",
        subtitle: "Couples, parents & families",
        columns: 4,
        items: [
          { icon: "\uD83D\uDC91", title: "Find a Spark \u2014 Couples", subtitle: "Reignite your connection" },
          { icon: "\uD83D\uDC6A", title: "Concerned Parent", subtitle: "Help for your child" },
          { icon: "\uD83D\uDC6A", title: "Family Plan", subtitle: "Care for 2-5 members", badge: "\u20B9499+" },
          { icon: "\uD83C\uDF93", title: "Teen & Student", subtitle: "Age-appropriate support", badge: "50% off" }
        ]
      },
      "For Corporates / Edu / Healthcare": {
        accent: "#1D4ED8",
        title: "For Corporates / Edu / Healthcare",
        subtitle: "Corporate, education institutions & healthcare units",
        columns: 4,
        items: [
          { icon: "\uD83C\uDFE2", title: "Corporate Wellness", subtitle: "Employee mental health programs" },
          { icon: "\uD83C\uDFEB", title: "Education Institutions", subtitle: "School & college wellness programs" },
          { icon: "\uD83C\uDFE5", title: "Healthcare Units", subtitle: "Hospital & clinic integration" },
          { icon: "\uD83C\uDFDB\uFE0F", title: "Government Agency", subtitle: "Tele-MANAS & ASHA worker programs" }
        ]
      },
      "Certify 2 Earn More": {
        accent: "#16A34A",
        title: "Certify 2 Earn More",
        subtitle: "Certifications, training & shop",
        columns: 4,
        items: [
          { icon: "\uD83C\uDFC6", title: "Certification Hub", subtitle: "CBT, NLP, 5Whys training", badge: "Pro" },
          { icon: "\uD83E\uDDD1", title: "Join as Therapist", subtitle: "Earn \u20B950K-2L/month" }
        ]
      },
      MyDigitalClinic: {
        accent: "#1D4ED8",
        title: "MyDigitalClinic",
        subtitle: "Digitize your practice - your patients, your data",
        columns: 5,
        items: [
          { icon: "\uD83D\uDC64", title: "Patient Database", subtitle: "DPDPA-compliant vault" },
          { icon: "\uD83D\uDCDD", title: "Session Notes", subtitle: "SOAP, CBT, Trauma templates" },
          { icon: "\uD83D\uDCC6", title: "Scheduling", subtitle: "Booking + auto-reminders" },
          { icon: "\uD83D\uDC8A", title: "Prescriptions", subtitle: "Digital sign + PDF + delivery" },
          { icon: "\uD83D\uDCCA", title: "Progress Tracking", subtitle: "PHQ-9/GAD-7 trends" },
          { icon: "\u2728", title: "3 days", subtitle: "All modules unlocked", badge: "Free" }
        ]
      },
      "NRI | Global Inc": {
        accent: "#EA580C",
        title: "NRI | Global Inc",
        subtitle: "Global Indians, local language care",
        columns: 1,
        items: [
          {
            icon: "\uD83C\uDF0E",
            title: "NRI Landing",
            subtitle: "Therapy in your mother tongue — heal with the right care from anywhere",
            badge: "New"
          }
        ]
      }
    }),
    []
  );

  const openQuickNavMenu = (label: string) => {
    if (!quickNavMegaMenus[label]) {
      setActiveQuickNav(null);
      return;
    }
    if (quickNavCloseTimer.current) {
      clearTimeout(quickNavCloseTimer.current);
      quickNavCloseTimer.current = null;
    }
    setActiveQuickNav(label);
  };

  const keepQuickNavMenuOpen = () => {
    if (quickNavCloseTimer.current) {
      clearTimeout(quickNavCloseTimer.current);
      quickNavCloseTimer.current = null;
    }
  };

  const closeQuickNavMenuWithDelay = () => {
    if (typeof window !== "undefined" && !window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      return;
    }
    if (quickNavCloseTimer.current) {
      clearTimeout(quickNavCloseTimer.current);
    }
    quickNavCloseTimer.current = setTimeout(() => {
      setActiveQuickNav(null);
      setQuickNavMegaTop(null);
    }, 120);
  };

  const updateQuickNavMegaPosition = useCallback(() => {
    if (!quickNavRowRef.current || window.innerWidth > 980) {
      setQuickNavMegaTop(null);
      return;
    }
    const rect = quickNavRowRef.current.getBoundingClientRect();
    setQuickNavMegaTop(rect.bottom + 6);
  }, []);

  const activateQuickNavChip = useCallback(
    (label: string, hasMegaMenu: boolean) => {
      if (quickNavCloseTimer.current) {
        clearTimeout(quickNavCloseTimer.current);
        quickNavCloseTimer.current = null;
      }
      if (hasMegaMenu) {
        setActiveQuickNav((current) => {
          const next = current === label ? null : label;
          if (next) {
            requestAnimationFrame(updateQuickNavMegaPosition);
          } else {
            setQuickNavMegaTop(null);
          }
          return next;
        });
        return;
      }
      setActiveQuickNav(null);
      setQuickNavMegaTop(null);
      const fallbackRoute = menuFallbackRoutes[label];
      if (fallbackRoute) navigate(fallbackRoute);
    },
    [navigate, updateQuickNavMegaPosition, menuFallbackRoutes]
  );

  useEffect(() => {
    if (!activeQuickNav || window.innerWidth > 980) return;
    updateQuickNavMegaPosition();
  }, [activeQuickNav, updateQuickNavMegaPosition]);

  const handleQuickNavChipPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === "touch") {
      quickNavTouchStart.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleQuickNavChipPointerUp = (
    e: React.PointerEvent<HTMLButtonElement>,
    label: string,
    hasMegaMenu: boolean
  ) => {
    if (e.pointerType !== "touch") return;
    const start = quickNavTouchStart.current;
    quickNavTouchStart.current = null;
    if (!start) return;
    const dx = Math.abs(e.clientX - start.x);
    const dy = Math.abs(e.clientY - start.y);
    if (dx > 14 || dy > 14) return;
    e.preventDefault();
    quickNavTouchHandled.current = true;
    activateQuickNavChip(label, hasMegaMenu);
  };

  useEffect(() => {
    if (!activeQuickNav || window.innerWidth > 980) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        quickNavRowRef.current?.contains(target) ||
        quickNavMegaRef.current?.contains(target)
      ) {
        return;
      }
      setActiveQuickNav(null);
      setQuickNavMegaTop(null);
    };

    const handleReposition = () => updateQuickNavMegaPosition();

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown, { passive: true });
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, { passive: true });

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition);
    };
  }, [activeQuickNav, updateQuickNavMegaPosition]);

  const languageLabelMap = {
    English: "English",
    Hindi: "हिन्दी",
    Tamil: "தமிழ்",
    Telugu: "తెలుగు",
    Kannada: "ಕನ್ನಡ"
  } as const;

  const searchTermRoutes: Array<{ match: (q: string) => boolean; route: string }> = [
    { match: (q) => q.includes("anxious") || q.includes("anxiety"), route: "/helping-hand" },
    { match: (q) => q.includes("couple"), route: "/find-spark" },
    { match: (q) => q.includes("psychiatr"), route: "/helping-hand" },
    { match: (q) => q.includes("group"), route: "/group-therapy" },
    { match: (q) => q.includes("screen") || q.includes("assessment"), route: "/assessment" },
    { match: (q) => q.includes("therapy") || q.includes("therapist"), route: "/premium-theraphy" },
    { match: (q) => q.includes("ai") || q.includes("buddy"), route: "/ai-power-hub" },
    { match: (q) => q.includes("pet"), route: "/pet" },
    { match: (q) => q.includes("crisis") || q.includes("sos"), route: "/crisis" },
  ];

  const runSearch = (query: string) => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return;

    const matched = searchTermRoutes.find(({ match }) => match(normalized));
    setShowSearch(false);
    setSearchQuery("");
    navigate(matched?.route ?? "/helping-hand");
  };

  const handleSearchSubmit = () => runSearch(searchQuery);

  // FIX: Derived scroll CSS classes purely from React state — no DOM manipulation.
  // Previously the code did both navbar.classList.add("scrolled") AND setIsScrolled(),
  // which caused React's virtual DOM to diverge from the real DOM on re-renders.
  const headerBg = isScrolled ? "rgba(255, 255, 255, 0.95)" : "rgba(255, 255, 255, 0.8)";
  const headerBorder = isScrolled ? "1px solid rgba(226, 232, 240, 0.8)" : "1px solid rgba(46, 38, 38, 0.3)";
  const headerShadow = isScrolled ? "0 4px 25px rgba(0, 0, 0, 0.05)" : "none";
  return (
    <>
      <header
        className="landing-sticky-header"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 1000,
          width: "100%",
          transition: "background 0.4s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.4s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          background: headerBg,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: headerBorder,
          boxShadow: headerShadow,
          ["--landing-promo-offset" as string]: showTopPromo ? "76px" : "0px"
        }}
      >
        {showTopPromo && (
          <div
            className={`landing-promo-bar${isScrolled ? " landing-promo-bar--collapsed" : ""}`}
            style={{
              background: "linear-gradient(90deg, #2E7D32, #2F855A)",
              color: "white",
              fontSize: "12px",
              fontWeight: 700
            }}
          >
            <div
              style={{
                maxWidth: "1260px",
                margin: "0 auto",
                padding: "10px 16px",
                display: "flex",
                alignItems: "center",
                gap: "14px"
              }}
              role="button"
              tabIndex={0}
              onClick={handleHitASixerPromo}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleHitASixerPromo();
                }
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 }}>
                <span className="notranslate" translate="no" style={{ opacity: 0.95 }}>&#127951;</span>
                <span style={{ whiteSpace: "nowrap" }}>HIT A SIXER!</span>
                <span style={{ opacity: 0.95, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis" }}>
                  Refer a friend & both get <span style={{ color: "#FFE082" }}>10% off</span> next therapy session
                </span>
              </div>

              <button
                type="button"
                onClick={handleHitASixerPromo}
                style={{
                  border: "none",
                  cursor: "pointer",
                  background: "#9CCC65",
                  color: "#1B1B1B",
                  fontWeight: 800,
                  fontSize: "11px",
                  padding: "6px 14px",
                  borderRadius: "16px",
                  whiteSpace: "nowrap"
                }}
              >
                CLAIM &#8377;70 CREDIT <span className="notranslate" translate="no">&#9889;</span>
              </button>

              <span style={{ fontSize: "11px", fontWeight: 600, opacity: 0.9, whiteSpace: "nowrap" }}>
                Offer expires in 23:57:36
              </span>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTopPromo(false);
                }}
                aria-label="Close"
                style={{
                  border: "none",
                  cursor: "pointer",
                  background: "transparent",
                  color: "rgba(255,255,255,0.9)",
                  fontSize: "16px",
                  lineHeight: 1
                }}
              >
                &times;
              </button>
            </div>
          </div>
        )}

        {/* FIX: Removed brandBarRef and data-landing-brand-bar attribute entirely.
            The brand bar is now a plain React-controlled div. The old DOM-based
            dedup logic (bars.forEach bar.remove()) was the main source of the
            double-navbar bug: React would re-insert the bar after the DOM removal,
            causing a visible flash of two navbars before the next dedup cycle ran. */}
        <div className="landing-nav-shell">
          <a
            className="landing-fixed-logo"
            href="/landing"
            aria-label="MANAS360 Home"
          >
            {/* Logo icon */}
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "88px",
              height: "88px",
              borderRadius: "18px",
              padding: "3px",
              boxSizing: "border-box",
              overflow: "hidden",
              background: "rgba(255,255,255,0.96)",
              border: "1px solid rgba(226, 232, 240, 0.92)",
              backdropFilter: "blur(10px)",
              boxShadow: isScrolled ? "0 10px 24px rgba(15,23,42,0.14)" : "0 6px 16px rgba(15,23,42,0.10)",
              flexShrink: 0,
              transition: "box-shadow 0.28s ease"
            }}>
              <img
                src={logo}
                alt="MANAS360"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  objectPosition: "center",
                  display: "block",
                  borderRadius: "16px",
                  background: "#FFFFFF"
                }}
              />
            </div>

          </a>
          <div className={`brand-bar${isScrolled ? " scrolled" : ""}`}>
            <div style={{ maxWidth: "1260px", margin: "0 auto", padding: "0 16px" }}>
              <div className="brand-bar-top-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "52px", gap: "8px", flexWrap: "nowrap" }}>
                <div className="brand-bar-top-leading" style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "nowrap", minWidth: 0 }}>
                  <div className="landing-brand-langs notranslate" translate="no" style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "nowrap" }}>
                    {(["English", "Hindi", "Kannada", "Tamil", "Telugu"] as const).map((lang) => {
                      const active = selectedLanguage === lang;
                      return (
                        <button
                          key={lang}
                          type="button"
                          className="notranslate"
                          translate="no"
                          onClick={() => setSelectedLanguage(lang)}
                          style={{
                            border: "1px solid #E8EDF2",
                            background: active ? "#0B2D5E" : "white",
                            color: active ? "white" : "#1A1A2E",
                            fontSize: "10px",
                            fontWeight: 800,
                            padding: "5px 9px",
                            borderRadius: "16px",
                            cursor: "pointer"
                          }}
                        >
                          <span className="notranslate" translate="no">{languageLabelMap[lang]}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div
                    className="landing-top-shortcuts"
                    style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "nowrap" }}
                    onMouseEnter={keepQuickNavMenuOpen}
                    onMouseLeave={closeQuickNavMenuWithDelay}
                  >
                    {topShortcutItems.map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => navigate(item.route)}
                        onMouseEnter={() => openQuickNavMenu(item.label)}
                        className="landing-top-shortcut-btn"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          border: "1px solid #D5DEE9",
                          background: "white",
                          color: "#1A1A2E",
                          fontSize: "10px",
                          fontWeight: 800,
                          padding: "5px 8px",
                          borderRadius: "999px",
                          cursor: "pointer",
                          whiteSpace: "nowrap"
                        }}
                      >
                        <span aria-hidden className="notranslate" translate="no">{item.icon}</span>
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="landing-brand-actions" style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "auto" }}>
                  {/* <button
                  type="button"
                  onClick={toggleTheme}
                  className="landing-theme-toggle"
                  aria-label="Toggle theme"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    border: "1px solid #D5DEE9",
                    background: "#F8FBFF",
                    cursor: "pointer",
                    color: "#64748B",
                  }}
                >
                  {activeTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button> */}
                  <button
                    type="button"
                    className="landing-search-btn"
                    onClick={() => setShowSearch(true)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "6px 10px",
                      borderRadius: "18px",
                      border: "1px solid #D5DEE9",
                      cursor: "pointer",
                      background: "#F8FBFF",
                      minWidth: "150px"
                    }}
                  >
                    <span className="notranslate" translate="no" style={{ fontSize: "12px", color: "#2563EB" }}>&#128269;</span>
                    <span style={{ fontSize: "10px", color: "#64748B", flex: 1, textAlign: "left", fontWeight: 700 }}>Search...</span>
                    <span
                      style={{
                        fontSize: "9px",
                        color: "#64748B",
                        background: "#FFFFFF",
                        border: "1px solid #DDE5EF",
                        padding: "1px 6px",
                        borderRadius: "8px"
                      }}
                    >
                      ⌘ K
                    </span>
                  </button>

                  {isAuthenticated ? (
                    <button
                      type="button"
                      className="landing-profile-btn"
                      aria-label="Go to dashboard"
                      title="Dashboard"
                      onClick={() => navigate(getPostLoginRoute(user))}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        border: "1px solid #D5DEE9",
                        cursor: "pointer",
                        background: "#E8EFE6",
                        color: "#0B2D5E",
                        flexShrink: 0,
                      }}
                    >
                      {userInitial ? (
                        <span style={{ fontSize: "13px", fontWeight: 900 }}>
                          {userInitial}
                        </span>
                      ) : (
                        <User size={18} aria-hidden />
                      )}
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="landing-subscribe-btn"
                        onClick={() => navigate("/auth/signup")}
                        style={{
                          background: "#0B2D5E",
                          color: "white",
                          padding: "7px 12px",
                          borderRadius: "18px",
                          fontSize: "11px",
                          fontWeight: 900,
                          cursor: "pointer",
                          border: "none",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Subscribe
                      </button>

                      <div className="landing-login-wrap">
                        <button
                          ref={loginBtnRef}
                          type="button"
                          className="landing-login-btn"
                          aria-expanded={loginDropdownOpen}
                          aria-haspopup="menu"
                          onClick={toggleLoginDropdown}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0px",
                            padding: "7px 12px",
                            borderRadius: "18px",
                            border: "1px solid #D5DEE9",
                            cursor: "pointer",
                            fontSize: "11px",
                            fontWeight: 800,
                            color: "#1A1A2E",
                            background: "white",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Log In
                        </button>

                        {loginDropdownOpen && (
                          <div
                            ref={loginDropdownRef}
                            className={`landing-login-dropdown${loginDropdownTop != null ? " landing-login-dropdown--mobile" : ""}`}
                            role="menu"
                            style={loginDropdownTop != null ? { top: loginDropdownTop } : undefined}
                          >
                            {loginOptions.map((option) => (
                              <button
                                key={option.type}
                                type="button"
                                role="menuitem"
                                onClick={() => handleLogin(option.type)}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "10px",
                                  width: "100%",
                                  padding: "10px 10px",
                                  borderRadius: "9px",
                                  cursor: "pointer",
                                  transition: "background 0.15s",
                                  border: "none",
                                  background: "transparent",
                                  textAlign: "left",
                                  fontFamily: "inherit",
                                }}
                                onMouseEnter={(e) => {
                                  (e.currentTarget as HTMLElement).style.background = "#FAFCFF";
                                }}
                                onMouseLeave={(e) => {
                                  (e.currentTarget as HTMLElement).style.background = "transparent";
                                }}
                              >
                                <span className="notranslate" translate="no" style={{ fontSize: "17px", width: "24px", textAlign: "center" }}>{option.icon}</span>
                                <div>
                                  <div style={{ fontSize: "12px", fontWeight: 900, color: "#1A1A2E" }}>{option.label}</div>
                                  <div style={{ fontSize: "10px", color: "#666680", marginTop: "1px" }}>{option.desc}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  <div className="landing-brand-socials" style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "6px" }}>
                    {[
                      { key: "wa", label: <MessageCircle className="h-4 w-4" />, href: "https://wa.me/919876543210" },
                      { key: "ig", label: <Instagram className="h-4 w-4" />, href: "https://instagram.com/manas360" },
                      { key: "yt", label: <Youtube className="h-4 w-4" />, href: "https://youtube.com/@manas360" },
                      { key: "in", label: <Linkedin className="h-4 w-4" />, href: "https://linkedin.com/company/manas360" }
                    ].map((s) => (
                      <a
                        key={s.key}
                        href={s.href}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "7px",
                          background: "transparent",
                          border: "none",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "13px",
                          fontWeight: 900,
                          color: "#66708A",
                          textDecoration: "none"
                        }}
                      >
                        <span className="notranslate" translate="no">{s.label}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Top shortcuts mega menu (full width like the one below) */}
              {activeQuickNav &&
                (activeQuickNav === "Premium Therapy Hub" || activeQuickNav === "AI Power Hub") &&
                quickNavMegaMenus[activeQuickNav] && (
                  <div
                    style={{ position: "relative" }}
                    onMouseEnter={keepQuickNavMenuOpen}
                    onMouseLeave={closeQuickNavMenuWithDelay}
                  >
                    <div style={{ position: "absolute", left: 0, right: 0, top: "10px", zIndex: 180 }}>
                      <div
                        style={{
                          background: "white",
                          borderRadius: "18px",
                          border: "1px solid rgba(226, 232, 240, 0.95)",
                          boxShadow: "0 28px 90px rgba(15, 23, 42, 0.22)",
                          overflow: "hidden"
                        }}
                      >
                        <div style={{ height: "3px", background: quickNavMegaMenus[activeQuickNav].accent }} />

                        <div style={{ padding: "18px 18px 16px 18px" }}>
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                            <div>
                              <div style={{ fontSize: "18px", fontWeight: 900, color: "#0F172A", lineHeight: 1.15 }}>
                                {quickNavMegaMenus[activeQuickNav].title}
                              </div>
                              <div style={{ marginTop: "4px", fontSize: "12px", fontWeight: 700, color: "#64748B" }}>
                                {quickNavMegaMenus[activeQuickNav].subtitle}
                              </div>
                            </div>
                          </div>

                          <div
                            className="quick-nav-mega-grid"
                            style={{
                              marginTop: "14px",
                              display: "grid",
                              gridTemplateColumns: `repeat(${quickNavMegaMenus[activeQuickNav].columns}, minmax(0, 1fr))`,
                              gap: "10px"
                            }}
                          >
                            {quickNavMegaMenus[activeQuickNav].items.map((mi) => (
                              <div
                                key={mi.title}
                                style={{
                                  display: "flex",
                                  alignItems: "flex-start",
                                  gap: "10px",
                                  padding: "12px 12px",
                                  borderRadius: "14px",
                                  background: MEGA_ITEM_DEFAULT_BG,
                                  cursor: "pointer",
                                  transition: "background 0.15s ease"
                                }}
                                role="button"
                                tabIndex={0}
                                onClick={() => handleMegaItemNav(mi.title, activeQuickNav)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    handleMegaItemNav(mi.title, activeQuickNav);
                                  }
                                }}
                                {...megaItemHoverHandlers(quickNavMegaMenus[activeQuickNav].accent)}
                              >
                                <div
                                  className="notranslate"
                                  translate="no"
                                  style={{
                                    width: "34px",
                                    height: "34px",
                                    borderRadius: "10px",
                                    border: "1px solid rgba(232, 237, 242, 0.95)",
                                    background: "#FFFFFF",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flex: "0 0 auto",
                                    fontSize: "18px"
                                  }}
                                  aria-hidden
                                >
                                  {mi.icon}
                                </div>

                                <div style={{ minWidth: 0, flex: 1 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                                    <div
                                      style={{
                                        fontSize: "13px",
                                        fontWeight: 900,
                                        color: "#0F172A",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis"
                                      }}
                                    >
                                      {mi.title}
                                    </div>
                                    {mi.badge && (
                                      <div
                                        style={{
                                          fontSize: "10px",
                                          fontWeight: 900,
                                          padding: "2px 8px",
                                          borderRadius: "999px",
                                          border: "1px solid rgba(232, 237, 242, 0.95)",
                                          background: "#F1F5F9",
                                          color: "#0F172A",
                                          whiteSpace: "nowrap"
                                        }}
                                      >
                                        {mi.badge}
                                      </div>
                                    )}
                                  </div>
                                  <div style={{ marginTop: "2px", fontSize: "11px", fontWeight: 700, color: "#64748B", lineHeight: 1.45 }}>
                                    {mi.subtitle}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              <div
                ref={quickNavRowRef}
                className="quick-nav-row header-scroll-x"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  padding: "10px 0 14px 0",
                  borderTop: "1px solid rgba(232, 237, 242, 0.7)"
                }}
              >
                <div
                  className="quick-nav-scroll"
                  style={{ position: "relative", flex: 1, minWidth: 0 }}
                  onMouseEnter={keepQuickNavMenuOpen}
                  onMouseLeave={closeQuickNavMenuWithDelay}
                >
                  <div className="quick-nav">
                    {quickNavItems.map((item) => {
                      const menu = quickNavMegaMenus[item.label];
                      const isActive = activeQuickNav === item.label && !!menu;
                      const accent = menu?.accent;

                      return (
                        <button
                          key={item.label}
                          type="button"
                          aria-expanded={isActive}
                          aria-haspopup={menu ? "menu" : undefined}
                          onMouseEnter={() => {
                            if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
                              openQuickNavMenu(item.label);
                            }
                          }}
                          onPointerDown={handleQuickNavChipPointerDown}
                          onPointerUp={(e) => handleQuickNavChipPointerUp(e, item.label, !!menu)}
                          onClick={() => {
                            if (quickNavTouchHandled.current) {
                              quickNavTouchHandled.current = false;
                              return;
                            }
                            activateQuickNavChip(item.label, !!menu);
                          }}
                          className="quick-nav-chip quick-nav-chip-btn"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "clamp(9px, 0.82vw, 11px)",
                            fontWeight: 900,
                            color: "#000000",
                            opacity: 1,
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            padding: "4px 7px",
                            borderRadius: "999px",
                            border: isActive && accent ? `1px solid ${accent}` : "1px solid rgba(15, 23, 42, 0.22)",
                            background: "rgba(255,255,255,1)",
                            boxShadow: isActive ? "0 10px 24px rgba(15, 23, 42, 0.14)" : "0 2px 4px rgba(15,23,42,0.08)",
                            fontFamily: "inherit"
                          }}
                        >
                          <span className="quick-nav-chip-icon notranslate" translate="no" style={{ fontSize: "clamp(9px, 0.82vw, 11px)" }} aria-hidden>{item.icon}</span>
                          <span className="quick-nav-chip-label">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {activeQuickNav &&
                    quickNavMegaMenus[activeQuickNav] &&
                    quickNavItems.some((q) => q.label === activeQuickNav) && (
                      <div
                        ref={quickNavMegaRef}
                        className={`quick-nav-mega-panel${quickNavMegaTop != null ? " quick-nav-mega-panel--mobile" : ""}`}
                        onMouseEnter={keepQuickNavMenuOpen}
                        onMouseLeave={closeQuickNavMenuWithDelay}
                        style={quickNavMegaTop != null ? { top: quickNavMegaTop } : undefined}
                      >
                        <div
                          style={{
                            background: "white",
                            borderRadius: "18px",
                            border: "1px solid rgba(226, 232, 240, 0.95)",
                            boxShadow: "0 28px 90px rgba(15, 23, 42, 0.22)",
                            overflow: "hidden"
                          }}
                        >
                          <div style={{ height: "3px", background: quickNavMegaMenus[activeQuickNav].accent }} />

                          <div style={{ padding: "18px 18px 16px 18px" }}>
                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                              <div>
                                <div style={{ fontSize: "18px", fontWeight: 900, color: "#0F172A", lineHeight: 1.15 }}>
                                  {quickNavMegaMenus[activeQuickNav].title}
                                </div>
                                <div style={{ marginTop: "4px", fontSize: "12px", fontWeight: 700, color: "#64748B" }}>
                                  {quickNavMegaMenus[activeQuickNav].subtitle}
                                </div>
                              </div>
                            </div>

                            <div
                              className="quick-nav-mega-grid"
                              style={{
                                marginTop: "14px",
                                display: "grid",
                                gridTemplateColumns: `repeat(${quickNavMegaMenus[activeQuickNav].columns}, minmax(0, 1fr))`,
                                gap: "10px"
                              }}
                            >
                              {quickNavMegaMenus[activeQuickNav].items.map((mi) => (
                                <button
                                  key={mi.title}
                                  type="button"
                                  onClick={() => handleMegaItemNav(mi.title, activeQuickNav)}
                                  style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: "10px",
                                    width: "100%",
                                    padding: "12px 12px",
                                    borderRadius: "14px",
                                    background: MEGA_ITEM_DEFAULT_BG,
                                    cursor: "pointer",
                                    border: "none",
                                    textAlign: "left",
                                    fontFamily: "inherit",
                                    touchAction: "manipulation",
                                    transition: "background 0.15s ease"
                                  }}
                                  {...megaItemHoverHandlers(quickNavMegaMenus[activeQuickNav].accent)}
                                >
                                  <div
                                    className="notranslate"
                                    translate="no"
                                    style={{
                                      width: "34px",
                                      height: "34px",
                                      borderRadius: "10px",
                                      border: "1px solid rgba(232, 237, 242, 0.95)",
                                      background: "#FFFFFF",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      flex: "0 0 auto",
                                      fontSize: "18px"
                                    }}
                                    aria-hidden
                                  >
                                    {mi.icon}
                                  </div>

                                  <div style={{ minWidth: 0, flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                                      <div style={{ fontSize: "13px", fontWeight: 900, color: "#0F172A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                        {mi.title}
                                      </div>
                                      {mi.badge && (
                                        <div
                                          style={{
                                            fontSize: "10px",
                                            fontWeight: 900,
                                            padding: "2px 8px",
                                            borderRadius: "999px",
                                            border: "1px solid rgba(232, 237, 242, 0.95)",
                                            background: "#F1F5F9",
                                            color: "#0F172A",
                                            whiteSpace: "nowrap"
                                          }}
                                        >
                                          {mi.badge}
                                        </div>
                                      )}
                                    </div>
                                    <div style={{ marginTop: "2px", fontSize: "11px", fontWeight: 700, color: "#64748B", lineHeight: 1.45 }}>
                                      {mi.subtitle}
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      {showSearch && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Search"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.45)",
            zIndex: 1100,
            display: "flex",
            justifyContent: "center",
            paddingTop: "80px"
          }}
          onClick={() => setShowSearch(false)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              width: "92%",
              maxWidth: "580px",
              maxHeight: "68vh",
              overflow: "hidden",
              boxShadow: "0 24px 80px rgba(0, 0, 0, 0.22)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearchSubmit();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 14px",
                borderBottom: "1px solid #E8EDF2"
              }}
            >
              <span className="notranslate" translate="no" style={{ fontSize: "14px", color: "#64748B", flexShrink: 0 }} aria-hidden>
                &#128269;
              </span>
              <input
                type="search"
                placeholder="Try 'couples therapy' or 'I feel anxious'..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                aria-label="Search MANAS360"
                style={{
                  flex: 1,
                  minWidth: 0,
                  height: "36px",
                  padding: "0 10px",
                  border: "1px solid #CBD5E1",
                  borderRadius: "8px",
                  outline: "none",
                  fontSize: "13px",
                  fontFamily: "\"DM Sans\", sans-serif",
                  color: "#1A1A2E",
                  background: "#FAFCFF",
                  boxSizing: "border-box"
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#2563EB";
                  e.currentTarget.style.boxShadow = "0 0 0 2px rgba(37, 99, 235, 0.15)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#CBD5E1";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
              <button
                type="submit"
                disabled={!searchQuery.trim()}
                style={{
                  flexShrink: 0,
                  height: "36px",
                  padding: "0 14px",
                  borderRadius: "8px",
                  border: "none",
                  fontSize: "12px",
                  fontWeight: 800,
                  fontFamily: "\"DM Sans\", sans-serif",
                  cursor: searchQuery.trim() ? "pointer" : "not-allowed",
                  background: searchQuery.trim() ? "#0B2D5E" : "#E2E8F0",
                  color: searchQuery.trim() ? "#FFFFFF" : "#94A3B8",
                  transition: "background 0.15s ease, color 0.15s ease"
                }}
              >
                Search
              </button>
            </form>
            <div style={{ padding: "10px 14px 12px", maxHeight: "52vh", overflowY: "auto" }}>
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "#666680",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: "12px"
                }}
              >
                People often search for
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {["I feel anxious", "couples therapy", "psychiatrist", "group sessions", "free screening"].map((tag) => (
                  <div
                    key={tag}
                    role="button"
                    tabIndex={0}
                    onClick={() => runSearch(tag)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        (e.currentTarget as HTMLElement).click();
                      }
                    }}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "20px",
                      border: "1px solid #E8EDF2",
                      fontSize: "11.5px",
                      color: "#3D3D5C",
                      cursor: "pointer",
                      transition: "all 0.15s"
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "#E8EEF7";
                      (e.currentTarget as HTMLElement).style.borderColor = "#0B2D5E";
                      (e.currentTarget as HTMLElement).style.color = "#0B2D5E";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                      (e.currentTarget as HTMLElement).style.borderColor = "#E8EDF2";
                      (e.currentTarget as HTMLElement).style.color = "#3D3D5C";
                    }}
                  >
                    {tag}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      <style>{`${landingHeaderStyles}`}</style>

    </>
  );
};

export default HeaderPage;
