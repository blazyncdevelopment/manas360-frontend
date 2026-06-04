const PROVIDER_ID_KEY = 'manas360_provider_onboarding_id';
const PROVIDER_TXN_KEY = 'manas360_provider_platform_txn';
const PROVIDER_FEE_VERIFIED_KEY = 'manas360_provider_fee_verified_at';

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
