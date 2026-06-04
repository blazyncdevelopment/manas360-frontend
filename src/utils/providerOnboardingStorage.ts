const PROVIDER_ID_KEY = 'manas360_provider_onboarding_id';
const PROVIDER_TXN_KEY = 'manas360_provider_platform_txn';
const PROVIDER_FEE_VERIFIED_KEY = 'manas360_provider_fee_verified_at';
const ONBOARDING_SUBMITTED_PREFIX = 'manas360_provider_onboarding_submitted_';

/** TTL in milliseconds for the client-side fee-verified flag (10 minutes). */
const FEE_VERIFIED_TTL_MS = 10 * 60 * 1000;

export const setStoredProviderId = (providerId: string): void => {
	if (typeof window === 'undefined' || !providerId.trim()) return;
	const normalized = providerId.trim();
	sessionStorage.setItem(PROVIDER_ID_KEY, normalized);
	try {
		localStorage.setItem(PROVIDER_ID_KEY, normalized);
	} catch {
		// localStorage may be unavailable in private mode
	}
};

export const getStoredProviderId = (): string | null => {
	if (typeof window === 'undefined') return null;
	const fromSession = sessionStorage.getItem(PROVIDER_ID_KEY);
	if (fromSession?.trim()) {
		return fromSession.trim();
	}

	try {
		const fromLocal = localStorage.getItem(PROVIDER_ID_KEY);
		if (fromLocal?.trim()) {
			const normalized = fromLocal.trim();
			sessionStorage.setItem(PROVIDER_ID_KEY, normalized);
			return normalized;
		}
	} catch {
		// ignore
	}

	return null;
};

export const clearStoredProviderId = (): void => {
	if (typeof window === 'undefined') return;
	sessionStorage.removeItem(PROVIDER_ID_KEY);
	try {
		localStorage.removeItem(PROVIDER_ID_KEY);
	} catch {
		// ignore
	}
};

export const setStoredPlatformTransactionId = (transactionId: string): void => {
	if (typeof window === 'undefined' || !transactionId.trim()) return;
	sessionStorage.setItem(PROVIDER_TXN_KEY, transactionId.trim());
};

export const getStoredPlatformTransactionId = (): string | null => {
	if (typeof window === 'undefined') return null;
	return sessionStorage.getItem(PROVIDER_TXN_KEY);
};

export const clearStoredPlatformTransactionId = (): void => {
	if (typeof window === 'undefined') return;
	sessionStorage.removeItem(PROVIDER_TXN_KEY);
};

/**
 * Sets a short-lived flag (10 min) indicating the platform fee was verified.
 * This allows the onboarding page to open even if the backend webhook is slow.
 */
export const setFeeVerifiedFlag = (): void => {
	if (typeof window === 'undefined') return;
	sessionStorage.setItem(PROVIDER_FEE_VERIFIED_KEY, String(Date.now()));
};

/**
 * Returns true if the fee-verified flag is set and has not yet expired.
 */
export const isFeeVerifiedFlagSet = (): boolean => {
	if (typeof window === 'undefined') return false;
	const raw = sessionStorage.getItem(PROVIDER_FEE_VERIFIED_KEY);
	if (!raw) return false;
	const timestamp = Number(raw);
	if (!Number.isFinite(timestamp)) return false;
	return Date.now() - timestamp < FEE_VERIFIED_TTL_MS;
};

/** Clears the fee-verified flag. */
export const clearFeeVerifiedFlag = (): void => {
	if (typeof window === 'undefined') return;
	sessionStorage.removeItem(PROVIDER_FEE_VERIFIED_KEY);
};

const onboardingSubmittedKey = (userKey: string): string =>
	`${ONBOARDING_SUBMITTED_PREFIX}${userKey.trim()}`;

/** Set after successful POST /v1/provider/onboarding (survives refresh until cleared). */
export const setOnboardingSubmittedFlag = (userKey: string): void => {
	if (typeof window === 'undefined' || !userKey.trim()) return;
	const key = onboardingSubmittedKey(userKey);
	try {
		sessionStorage.setItem(key, '1');
		localStorage.setItem(key, '1');
	} catch {
		// ignore
	}
};

export const isOnboardingSubmittedFlagSet = (userKey: string): boolean => {
	if (typeof window === 'undefined' || !userKey.trim()) return false;
	const key = onboardingSubmittedKey(userKey);
	try {
		if (sessionStorage.getItem(key) === '1') return true;
		return localStorage.getItem(key) === '1';
	} catch {
		return false;
	}
};

/** Clears profile-submitted hint — call when platform fee activates so user can fill the 7-step form. */
export const clearOnboardingSubmittedFlag = (userKey: string): void => {
	if (typeof window === 'undefined' || !userKey.trim()) return;
	const key = onboardingSubmittedKey(userKey);
	try {
		sessionStorage.removeItem(key);
		localStorage.removeItem(key);
	} catch {
		// ignore
	}
};

export const extractProviderId = (payload: unknown): string | null => {
	if (!payload || typeof payload !== 'object') return null;

	const record = payload as Record<string, unknown>;
	const candidates: unknown[] = [record.provider_id, record.providerId];

	if (record.data && typeof record.data === 'object') {
		const nested = record.data as Record<string, unknown>;
		candidates.push(nested.provider_id, nested.providerId);
	}

	for (const value of candidates) {
		if (typeof value === 'string' && value.trim()) {
			return value.trim();
		}
	}

	return null;
};
