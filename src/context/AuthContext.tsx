import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  login as loginApi,
  logout as logoutApi,
  me as meApi,
  becomeProvider as becomeProviderApi,
  type AuthUser,
} from '../api/auth';
import { clearAuthTokens, hasStoredAccessToken } from '../utils/authToken';
import { extractProviderId, setStoredProviderId } from '../utils/providerOnboardingStorage';
import { hasProviderSubmittedOnboarding } from '../lib/providerOnboardingFlow';

export type AppRole =
  | 'patient'
  | 'learner'
  | 'therapist'
  | 'psychiatrist'
  | 'psychologist'
  | 'coach'
  | 'admin'
  | 'superadmin'
  | 'clinicaldirector'
  | 'financemanager'
  | 'complianceofficer'
  | 'corporate';

const normalizeRole = (value: unknown): AppRole | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.toLowerCase().replace(/_/g, '');
  if (
    normalized === 'patient' ||
    normalized === 'learner' ||
    normalized === 'therapist' ||
    normalized === 'psychiatrist' ||
    normalized === 'psychologist' ||
    normalized === 'coach' ||
    normalized === 'admin' ||
    normalized === 'superadmin' ||
    normalized === 'clinicaldirector' ||
    normalized === 'financemanager' ||
    normalized === 'complianceofficer' ||
    normalized === 'corporate'
  ) {
    return normalized as AppRole;
  }

  return null;
};

export const getDefaultRouteForRole = (role: unknown): string => {
  const normalizedRole = normalizeRole(role);
  if (normalizedRole === 'psychologist') return '/provider/dashboard';
  if (normalizedRole === 'complianceofficer') return '/admin/compliance';
  if (
    normalizedRole === 'admin' ||
    normalizedRole === 'superadmin' ||
    normalizedRole === 'clinicaldirector' ||
    normalizedRole === 'financemanager'
  ) {
    return '/admin/dashboard';
  }
  if (normalizedRole === 'psychiatrist') return '/provider/dashboard';
  if (normalizedRole === 'therapist' || normalizedRole === 'coach') return '/provider/dashboard';
  return '/patient/sessions';
};

const isProviderRole = (role: unknown): boolean => {
  const normalizedRole = normalizeRole(role);
  return normalizedRole === 'learner' || normalizedRole === 'therapist' || normalizedRole === 'psychiatrist' || normalizedRole === 'psychologist' || normalizedRole === 'coach';
};

const toBoolean = (value: unknown): boolean => value === true || value === 'true' || value === 1 || value === '1';

export const hasCorporateAccess = (user: AuthUser | null | undefined): boolean => {
  if (!user) return false;

  // 1. Explicit role
  if (normalizeRole(user.role) === 'corporate') return true;

  // 2. Explicit boolean flag — check every casing the backend might return
  const raw = user as any;
  const adminFlag =
    toBoolean(raw.isCompanyAdmin) ||
    toBoolean(raw.is_company_admin) ||
    toBoolean(raw.isCorpAdmin) ||
    toBoolean(raw.is_corp_admin) ||
    toBoolean(raw.corporateAdmin) ||
    toBoolean(raw.corporate_admin) ||
    toBoolean(raw.isAdmin) ||
    toBoolean(raw.is_admin);
  if (adminFlag) return true;

  // 3. Any non-empty company/entity key
  const companyKey =
    raw.companyKey ??
    raw.company_key ??
    raw.entityKey ??
    raw.entity_key ??
    raw.orgKey ??
    raw.org_key ??
    raw.organizationKey ??
    raw.organization_key;
  if (typeof companyKey === 'string' && companyKey.trim().length > 0) return true;

  return false;
};

export const isPlatformAdminUser = (user: AuthUser | null | undefined): boolean => {
  if (!user) return false;
  const role = normalizeRole(user.role);
  return (
    (role === 'admin' ||
      role === 'superadmin' ||
      role === 'clinicaldirector' ||
      role === 'financemanager' ||
      role === 'complianceofficer') &&
    !hasCorporateAccess(user)
  );
};

export const getPostLoginRoute = (user: AuthUser | null | undefined): string => {
  if (!user) return '/patient/sessions';

  if ((user as any)?.legalAcceptanceRequired) {
    return '/auth/legal-accept';
  }

  // Corporate check MUST come before requiresSubscription — corporate admins
  // are not subject to patient subscription gating.
  if (hasCorporateAccess(user)) {
    return '/corporate/dashboard';
  }

  // If patient requires subscription, route to plans page
  if ((user as any)?.requiresSubscription) {
    if ((user as any)?.patientSubscriptionActive) {
      return '/patient/sessions';
    }
    return '/plans';
  }

  if (normalizeRole(user.role) === 'complianceofficer') {
    return '/admin/compliance';
  }

  if (isPlatformAdminUser(user)) {
    return '/admin/dashboard';
  }

  if (isProviderRole(user.role)) {
    const normalizedRole = normalizeRole(user.role);

    // Learners only need dashboard access
    if (normalizedRole === 'learner') {
      return '/provider/dashboard';
    }

    // Step 1: Platform fee not paid → subscription page
    if (!user.platformAccessActive) {
      return '/provider/subscription';
    }

    // Step 2: Onboarding form not submitted → setup wizard
    if (!hasProviderSubmittedOnboarding(user)) {
      return '/onboarding/provider-setup';
    }

    // Step 3: Admin hasn't verified yet → verification pending
    if (!user.isTherapistVerified) {
      return '/provider/verification-pending';
    }

    // All steps done → dashboard
    return '/provider/dashboard';
  }

  return getDefaultRouteForRole(user.role);
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  isReady: boolean;
  isAuthenticated: boolean;
  login: (identifier: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  checkAuth: (options?: { force?: boolean }) => Promise<void>;
  /** Apply OTP verify user immediately, then refresh from /auth/me when possible. */
  syncSessionAfterOtp: (otpUser: AuthUser) => Promise<AuthUser>;
  becomeProvider: () => Promise<void>;
};

type AuthContextGlobal = typeof globalThis & {
  __MANAS360_AUTH_CONTEXT__?: React.Context<AuthContextValue | null>;
};

const authContextGlobal = globalThis as AuthContextGlobal;

// Keep a single context instance across Vite HMR updates.
const AuthContext = authContextGlobal.__MANAS360_AUTH_CONTEXT__ ?? createContext<AuthContextValue | null>(null);
if (!authContextGlobal.__MANAS360_AUTH_CONTEXT__) {
  authContextGlobal.__MANAS360_AUTH_CONTEXT__ = AuthContext;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const hasCheckedInitialAuthRef = useRef(false);
  const authProbeBlockKey = 'manas360.auth.probe.blocked';

  const hasSessionHint = useCallback((): boolean => {
    if (typeof document === 'undefined') {
      return false;
    }

    if (typeof window !== 'undefined' && window.sessionStorage.getItem(authProbeBlockKey) === '1') {
      return false;
    }

    if (hasStoredAccessToken()) {
      return true;
    }

    const csrfCookieName = (import.meta.env.VITE_CSRF_COOKIE_NAME || 'csrf_token').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(?:^|; )${csrfCookieName}=`).test(document.cookie);
  }, [authProbeBlockKey]);

  const clearSessionHint = useCallback((): void => {
    if (typeof document === 'undefined') {
      return;
    }

    const csrfCookieName = import.meta.env.VITE_CSRF_COOKIE_NAME || 'csrf_token';
    document.cookie = `${csrfCookieName}=; Max-Age=0; path=/`;
    document.cookie = `${csrfCookieName}=; Max-Age=0; path=/api`;

    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(authProbeBlockKey);
    }
  }, [authProbeBlockKey]);

  const checkAuth = useCallback(async (options?: { force?: boolean }) => {
    const shouldForceProbe = options?.force === true;

    if (!shouldForceProbe && !hasSessionHint()) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const currentUser = await meApi();
      const providerId = extractProviderId(currentUser);
      if (providerId) {
        setStoredProviderId(providerId);
      }
      setUser(currentUser);
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(authProbeBlockKey);
      }
    } catch (error: any) {
      setUser(null);
      clearSessionHint();
      if (error?.response?.status === 401) {
        clearAuthTokens();
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem(authProbeBlockKey, '1');
        }
      }
    } finally {
      setLoading(false);
    }
  }, [hasSessionHint, clearSessionHint, authProbeBlockKey]);

  const syncSessionAfterOtp = useCallback(async (otpUser: AuthUser): Promise<AuthUser> => {
    setUser(otpUser);
    setLoading(false);
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(authProbeBlockKey);
    }

    const providerIdFromOtp = extractProviderId(otpUser);
    if (providerIdFromOtp) {
      setStoredProviderId(providerIdFromOtp);
    }

    try {
      const currentUser = await meApi();
      const providerIdFromMe = extractProviderId(currentUser);
      if (providerIdFromMe) {
        setStoredProviderId(providerIdFromMe);
      }
      setUser(currentUser);
      return currentUser;
    } catch {
      return otpUser;
    }
  }, [authProbeBlockKey]);

  useEffect(() => {
    if (hasCheckedInitialAuthRef.current) {
      return;
    }

    hasCheckedInitialAuthRef.current = true;
    void checkAuth();
  }, [checkAuth]);

  const login = useCallback(async (identifier: string, password: string) => {
    await loginApi({ identifier, password });

    // Confirm session cookies are accepted by browser before marking user as authenticated.
    try {
      const currentUser = await meApi();
      setUser(currentUser);
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(authProbeBlockKey);
      }
      return currentUser;
    } catch {
      const hadBearerToken = hasStoredAccessToken();
      setUser(null);
      clearSessionHint();
      clearAuthTokens();
      throw new Error(
        hadBearerToken
          ? 'Login succeeded but your profile could not be loaded. Please try again.'
          : 'Login succeeded but session could not be established. Please enable cookies or retry.',
      );
    }
  }, [authProbeBlockKey, clearSessionHint]);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      // keep frontend state consistent even if backend session already expired
    } finally {
      if (typeof window !== 'undefined') {
        try {
          const themePref = window.localStorage.getItem('manas360_theme_preference');
          const cookieConsent = window.localStorage.getItem('manas360_cookie_consent');
          const cookieConsentTs = window.localStorage.getItem('manas360_cookie_consent_ts');
          window.localStorage.clear();
          if (themePref) {
            window.localStorage.setItem('manas360_theme_preference', themePref);
          }
          if (cookieConsent) {
            window.localStorage.setItem('manas360_cookie_consent', cookieConsent);
          }
          if (cookieConsentTs) {
            window.localStorage.setItem('manas360_cookie_consent_ts', cookieConsentTs);
          }
        } catch (err) {
          console.warn('Failed to clear local storage:', err);
        }
      }
      setUser(null);
      clearSessionHint();
      clearAuthTokens();
    }
  }, [clearSessionHint]);

  const becomeProvider = useCallback(async () => {
    const updatedUser = await becomeProviderApi();
    setUser(updatedUser);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isReady: !loading,
      isAuthenticated: !!user,
      login,
      logout,
      checkAuth,
      syncSessionAfterOtp,
      becomeProvider,
    }),
    [user, loading, login, logout, checkAuth, syncSessionAfterOtp, becomeProvider],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthProvider;
