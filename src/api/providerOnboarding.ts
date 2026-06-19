import type { AxiosError } from 'axios';
import { http } from '../lib/http';
import type { AuthUser } from './auth';
import { me as meApi } from './auth';
import { fetchProviderSettings } from './provider';
import { extractProviderId, getStoredProviderId, setStoredProviderId, setFeeVerifiedFlag } from '../utils/providerOnboardingStorage';

export type ProviderOnboardingNextStep = 'verify_otp' | 'pay_platform_fee' | string;

export interface ProviderRegisterPayload {
	name: string;
	phone: string;
	qualification: string;
	rci_number?: string;
}

export interface ProviderRegisterResult {
	success: boolean;
	provider_id?: string;
	message?: string;
	next_step?: ProviderOnboardingNextStep;
	devOtp?: string;
}

export interface ProviderVerifyOtpResult {
	success: boolean;
	provider_id?: string;
	next_step?: ProviderOnboardingNextStep;
	user?: AuthUser;
}

const unwrapBody = <T>(payload: unknown): T => {
	if (!payload || typeof payload !== 'object') {
		return payload as T;
	}

	const record = payload as Record<string, unknown>;
	if (record.data && typeof record.data === 'object') {
		return record.data as T;
	}

	return payload as T;
};

/** Reads dev OTP from API payloads (camelCase, snake_case, or nested `data`). */
export const extractDevOtp = (payload: unknown): string | null => {
	if (!payload || typeof payload !== 'object') {
		return null;
	}

	const record = payload as Record<string, unknown>;
	const candidates: unknown[] = [record.devOtp, record.dev_otp];

	if (record.data && typeof record.data === 'object') {
		const nested = record.data as Record<string, unknown>;
		candidates.push(nested.devOtp, nested.dev_otp);
	}

	for (const value of candidates) {
		if (typeof value === 'string' && value.trim()) {
			return value.trim();
		}
		if (typeof value === 'number' && Number.isFinite(value)) {
			return String(value);
		}
	}

	return null;
};

const extractProviderIdFromPayload = (payload: unknown): string | undefined => {
	if (!payload || typeof payload !== 'object') return undefined;

	const record = payload as Record<string, unknown>;
	const candidates = [record.provider_id, record.providerId];

	if (record.data && typeof record.data === 'object') {
		const nested = record.data as Record<string, unknown>;
		candidates.push(nested.provider_id, nested.providerId);
	}

	for (const value of candidates) {
		if (typeof value === 'string' && value.trim()) {
			return value.trim();
		}
	}

	return undefined;
};

const parseRegisterResponse = (responseData: unknown): ProviderRegisterResult => {
	const body = unwrapBody<ProviderRegisterResult>(responseData);
	const devOtp = extractDevOtp(responseData);
	const providerId = extractProviderIdFromPayload(responseData) ?? body.provider_id;

	return {
		...body,
		...(providerId ? { provider_id: providerId } : {}),
		...(devOtp ? { devOtp } : {}),
	};
};

/** Indian mobile for provider-onboarding APIs (10 digits, no + prefix). */
export const normalizePhoneForProviderOnboarding = (value: string): string => {
	const digits = String(value || '').replace(/\D/g, '');

	if (digits.length === 10) {
		return digits;
	}

	if (digits.length === 12 && digits.startsWith('91')) {
		return digits.slice(2);
	}

	if (digits.length === 11 && digits.startsWith('0')) {
		return digits.slice(1);
	}

	return digits;
};

export const getProviderOnboardingErrorMessage = (error: unknown, fallback = 'Request failed'): string => {
	const axiosError = error as AxiosError<{ message?: string; error?: string }>;
	const data = axiosError.response?.data;
	return data?.message || data?.error || fallback;
};

export const isProviderAlreadyRegisteredError = (error: unknown): boolean => {
	const axiosError = error as AxiosError<{ error?: string; provider_id?: string; status?: string }>;
	return axiosError.response?.status === 409;
};

/** Step 1 — Register provider (signup). `rci_number` is optional per API. */
export const registerProvider = async (payload: ProviderRegisterPayload): Promise<ProviderRegisterResult> => {
	const response = await http.post('/v1/provider-onboarding/register', {
		name: payload.name.trim(),
		phone: normalizePhoneForProviderOnboarding(payload.phone),
		qualification: payload.qualification.trim(),
		...(payload.rci_number?.trim() ? { rci_number: payload.rci_number.trim() } : {}),
	});

	return parseRegisterResponse(response.data);
};

/**
 * Step 1 (login) — Request OTP for an already-registered provider using `register`.
 * Existing numbers return 409 with `provider_id`; OTP is still sent.
 */
export const requestProviderLoginOtp = async (phone: string): Promise<ProviderRegisterResult> => {
	const normalizedPhone = normalizePhoneForProviderOnboarding(phone);

	try {
		const response = await http.post('/v1/provider-onboarding/register', {
			phone: normalizedPhone,
		});

		return parseRegisterResponse(response.data);
	} catch (err) {
		if (!isProviderAlreadyRegisteredError(err)) {
			throw err;
		}

		const conflictData = (err as AxiosError).response?.data;
		const providerId = extractProviderIdFromPayload(conflictData);
		const devOtp = extractDevOtp(conflictData);
		const conflictMessage =
			conflictData && typeof conflictData === 'object' && 'error' in conflictData
				? String((conflictData as { error?: string }).error || '')
				: 'Phone already registered';

		return {
			success: true,
			provider_id: providerId,
			message: conflictMessage,
			next_step: 'verify_otp',
			...(devOtp ? { devOtp } : {}),
		};
	}
};

/** Step 2 — Verify phone OTP. */
export const verifyProviderOnboardingOtp = async (
	phone: string,
	otp: string,
): Promise<ProviderVerifyOtpResult> => {
	const response = await http.post('/v1/provider-onboarding/verify-otp', {
		phone: normalizePhoneForProviderOnboarding(phone),
		otp: otp.trim(),
	});

	const body = unwrapBody<ProviderVerifyOtpResult>(response.data);
	const providerId = extractProviderIdFromPayload(response.data) ?? body.provider_id;

	return providerId ? { ...body, provider_id: providerId } : body;
};

export interface PlatformPaymentResult {
	success: boolean;
	payment_url: string;
	transaction_id: string;
	bypassed?: boolean;
}

/** Step 3 — Initiate ₹99 platform fee (PhonePe). */
export const initiatePlatformPayment = async (providerId: string): Promise<PlatformPaymentResult> => {
	const response = await http.post('/v1/provider-onboarding/initiate-platform-payment', {
		provider_id: providerId,
	});

	const body = unwrapBody<PlatformPaymentResult>(response.data);
	const record = response.data && typeof response.data === 'object'
		? (response.data as Record<string, unknown>)
		: {};

	return {
		success: body.success ?? true,
		payment_url: body.payment_url || String(record.payment_url || ''),
		transaction_id: body.transaction_id || String(record.transaction_id || ''),
		bypassed: body.bypassed || Boolean(record.bypassed),
	};
};

export type ProviderOnboardingStatusStep = {
	done?: boolean;
	[key: string]: unknown;
};

export interface ProviderOnboardingStatus {
	success?: boolean;
	pay?: ProviderOnboardingStatusStep;
	[key: string]: unknown;
}

export const getProviderOnboardingStatus = async (providerId: string): Promise<ProviderOnboardingStatus> => {
	const response = await http.get(`/v1/provider-onboarding/onboarding-status/${encodeURIComponent(providerId)}`);
	return unwrapBody<ProviderOnboardingStatus>(response.data);
};

export const isPlatformPaymentComplete = (status: ProviderOnboardingStatus): boolean => {
	const pay = status.pay;
	if (!pay || typeof pay !== 'object') return false;
	return pay.done === true;
};

export const shouldNavigateToPlatformFee = (result: ProviderVerifyOtpResult): boolean => (
	result.next_step === 'pay_platform_fee'
);

export type PlatformPaymentVerificationOutcome = 'success' | 'timeout' | 'failed';

const PLATFORM_VERIFY_POLL_INTERVAL_MS = 2500;
const PLATFORM_VERIFY_MAX_ATTEMPTS = 20;

/**
 * Full platform payment verification:
 * 1. Optionally calls platform-access-sync with the transaction_id
 * 2. Polls onboarding-status (pay.done)
 * 3. Confirms via /auth/me → platformAccessActive
 * 4. Sets short-lived fee-verified flag on success
 */
export const verifyPlatformPaymentSettled = async (
	providerId: string,
	transactionId?: string | null,
): Promise<PlatformPaymentVerificationOutcome> => {
	// Step 1: call platform-access sync (best-effort — ignore errors)
	if (transactionId?.trim()) {
		try {
			await http.post('/v1/provider-onboarding/platform-access-sync', {
				provider_id: providerId,
				transaction_id: transactionId.trim(),
			});
		} catch {
			// Best-effort — not all backends expose this endpoint yet
		}
	}

	// Step 2 + 3: poll onboarding-status and /auth/me
	for (let attempt = 0; attempt < PLATFORM_VERIFY_MAX_ATTEMPTS; attempt++) {
		if (attempt > 0) {
			await new Promise<void>((resolve) => window.setTimeout(resolve, PLATFORM_VERIFY_POLL_INTERVAL_MS));
		}

		try {
			const status = await getProviderOnboardingStatus(providerId);
			if (isPlatformPaymentComplete(status)) {
				setFeeVerifiedFlag();
				return 'success';
			}
		} catch {
			// Continue polling on network error
		}

		// Also check /auth/me for platformAccessActive
		try {
			const currentUser = await meApi();
			if (currentUser.platformAccessActive) {
				setFeeVerifiedFlag();
				return 'success';
			}
		} catch {
			// Continue polling
		}
	}

	// Timed out — set the optimistic flag so onboarding can still open
	setFeeVerifiedFlag();
	return 'timeout';
};

/**
 * Resolves provider onboarding UUID for platform-fee APIs.
 * Session/local storage may be empty after refresh or generic auth login.
 */
export const resolveProviderIdForOnboarding = async (
	user?: AuthUser | null,
	options?: { allowPhoneLookup?: boolean },
): Promise<string | null> => {
	const stored = getStoredProviderId();
	if (stored) {
		return stored;
	}

	const persist = (id: string | null | undefined): string | null => {
		if (!id?.trim()) return null;
		setStoredProviderId(id);
		return id.trim();
	};

	const fromUser = persist(extractProviderId(user));
	if (fromUser) {
		return fromUser;
	}

	let resolvedUser = user;
	if (!resolvedUser) {
		try {
			resolvedUser = await meApi();
		} catch {
			resolvedUser = undefined;
		}
	}

	const fromMe = persist(extractProviderId(resolvedUser));
	if (fromMe) {
		return fromMe;
	}

	try {
		const settings = await fetchProviderSettings();
		const fromSettings = persist(settings?.providerId);
		if (fromSettings) {
			return fromSettings;
		}
	} catch {
		// Profile/settings may not exist before first payment
	}

	if (options?.allowPhoneLookup !== false && resolvedUser?.phone?.trim()) {
		try {
			const lookup = await requestProviderLoginOtp(resolvedUser.phone);
			return persist(lookup.provider_id);
		} catch {
			// ignore
		}
	}

	return null;
};

export const verifyPAN = async (providerId: string, panNumber: string, nameOnPan: string): Promise<{ success: boolean; data?: any; error?: string }> => {
	const response = await http.post('/v1/provider-onboarding/kyc/verify-pan', {
		providerId,
		panNumber,
		nameOnPan,
	});
	return response.data;
};

export const verifyBankAccount = async (providerId: string, accountNumber: string, ifsc: string, accountName: string): Promise<{ success: boolean; data?: any; error?: string }> => {
	const response = await http.post('/v1/provider-onboarding/kyc/verify-bank', {
		providerId,
		accountNumber,
		ifsc,
		accountName,
	});
	return response.data;
};
