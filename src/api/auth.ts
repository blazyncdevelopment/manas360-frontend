import type { AxiosError } from 'axios';
import { http } from '../lib/http';
import { getApiBaseUrl } from '../lib/runtimeEnv';
import { getAccessToken } from '../utils/authToken';
import { extractDevOtp } from './providerOnboarding';

interface ApiEnvelope<T> {
	success: boolean;
	message?: string;
	data: T;
}

export interface LegalDocument {
	id: string;
	type: string;
	version: number;
	title: string;
	publishedAt?: string;
}

export interface AuthUser {
	id: string;
	email: string | null;
	phone: string | null;
	role: 'patient' | 'learner' | 'therapist' | 'psychiatrist' | 'psychologist' | 'coach' | 'admin' | string;
	companyKey?: string | null;
	company_key?: string | null;
	isCompanyAdmin?: boolean | null;
	is_company_admin?: boolean | null;
	firstName?: string | null;
	lastName?: string | null;
	emailVerified?: boolean;
	phoneVerified?: boolean;
	mfaEnabled?: boolean;
	isTherapistVerified?: boolean;
	therapistVerifiedAt?: string | null;
	onboardingStatus?: 'PENDING' | 'COMPLETED' | 'REJECTED' | string | null;
	providerOnboardingCompleted?: boolean;
	providerProfileVerified?: boolean;
	requiresPlatformPayment?: boolean;
	platformAccessActive?: boolean;
	requiresSubscription?: boolean;
	patientSubscriptionActive?: boolean;
	patientSubscriptionPlan?: string | null;
	legalAcceptanceRequired?: boolean;
	nriTermsAccepted?: boolean;
	pendingLegalDocuments?: LegalDocument[];
	permissions?: string[];
	adminPolicies?: Record<string, string[]>;
	adminPolicyVersion?: number;
	aadhaarNumber?: string | null;
	providerId?: string | null;
	provider_id?: string | null;
}

export interface LoginPayload {
	identifier: string;
	password: string;
}

export interface ProviderRegisterPayload {
	professionalType: string;
	fullName: string;
	email: string;
	registrationNum: string;
	yearsOfExperience: number;
	education: string;
	licenseRci?: string;
	licenseNmc?: string;
	clinicalCategories: string[];
	specializations: string[];
	languages: string[];
	certifications?: string[];
	corporateReady: boolean;
	nriSessionEnabled: boolean;
	shiftPreferences: string[];
	consultationFee: number;
	bankDetails: {
		accountName: string;
		accountNumber: string;
		ifsc: string;
		bankName: string;
		upiId?: string;
	};
	tagline: string;
	bio: string;
	digitalSignature: string;
	// Extended 7-step onboarding fields
	name?: string;
	phone?: string;
	dob?: string;
	city?: string;
	state?: string;
	degree?: string;
	university?: string;
	yearOfPassing?: string;
	degreeCertificateUrl?: string;
	idProofUrl?: string;
	contactEmail?: string;
	availability?: Record<string, string[]>;
	hourlyRate?: number;
	ethicsAgreed?: boolean;
}

export type ClinicalScreeningOtpPayload = {
	type: 'PHQ-9' | 'GAD-7';
	answers: number[];
};

export interface SignupConsentPayload {
	acceptedTerms: boolean;
	acceptedDocuments?: string[];
	nri_declared?: boolean;
	nri_tos_accepted?: boolean;
	nri_tos_accepted_at?: string;
	nri_timezone_pool?: string;
	clinicalScreening?: ClinicalScreeningOtpPayload;
}

export const getApiErrorMessage = (error: unknown, fallback = 'Request failed'): string => {
	// Check the axios response body FIRST — it contains the real backend message.
	// Doing instanceof Error first would return the generic axios "Request failed with status code 4xx".
	const axiosError = error as AxiosError<{ message?: string; error?: string; details?: unknown }>;
	const data = axiosError.response?.data;
	const backendMsg = data?.message || data?.error;
	if (typeof backendMsg === 'string' && backendMsg.trim()) {
		return backendMsg.trim();
	}
	if (error instanceof Error && error.message.trim()) {
		return error.message;
	}
	return fallback;
};

const normalizePhoneForAuth = (value: string): string => {
	const compactPhone = String(value || '').trim().replace(/[\s()-]/g, '');

	if (/^\d{10}$/.test(compactPhone)) {
		return `+91${compactPhone}`;
	}

	if (/^91\d{10}$/.test(compactPhone)) {
		return `+${compactPhone}`;
	}

	return compactPhone;
};

export type AuthSessionPayload = {
	user: AuthUser;
	sessionId: string;
	accessToken?: string;
	refreshToken?: string;
};

export const login = async (payload: LoginPayload): Promise<AuthUser> => {
	const response = await http.post<ApiEnvelope<AuthSessionPayload>>('/v1/auth/login', payload);
	const loggedInUser = response.data.data.user;

	if (!loggedInUser?.role) {
		try {
			return await me();
		} catch {
			return loggedInUser;
		}
	}

	return loggedInUser;
};

export const providerRegister = async (payload: ProviderRegisterPayload): Promise<void> => {
	await http.post<ApiEnvelope<unknown>>('/v1/provider/onboarding', payload);
};

export const googleLogin = async (idToken: string): Promise<AuthUser> => {
	const response = await http.post<ApiEnvelope<AuthSessionPayload>>('/v1/auth/login/google', { idToken });
	return response.data.data.user;
};

export const signupWithPhone = async (
	phone: string,
	profile?: { name?: string; role?: 'patient' | 'learner' | 'therapist' | 'psychiatrist' | 'psychologist' | 'coach' },
): Promise<{ userId: string; phone: string; message: string; devOtp?: string }> => {
	const normalizedPhone = normalizePhoneForAuth(phone);
	const response = await http.post<ApiEnvelope<{ userId: string; phone: string; message: string; devOtp?: string }>>('/v1/auth/signup/phone', {
		phone: normalizedPhone,
		...(profile || {}),
	});
	const data = response.data.data;
	const devOtp = extractDevOtp(response.data) ?? data.devOtp;

	return devOtp ? { ...data, devOtp } : data;
};

export const verifyPhoneSignupOtp = async (
	phone: string,
	otp: string,
	consent?: SignupConsentPayload,
	guestGameToken?: string,
): Promise<AuthSessionPayload> => {
	const normalizedPhone = normalizePhoneForAuth(phone);
	const response = await http.post<ApiEnvelope<AuthSessionPayload>>('/v1/auth/verify/phone-otp', {
		phone: normalizedPhone,
		otp,
		...(consent || {}),
		guestGameToken,
	});
	return response.data.data;
};

export const me = async (): Promise<AuthUser> => {
	const response = await http.get<ApiEnvelope<AuthUser>>('/v1/auth/me');
	return response.data.data;
};

export const getRequiredLegalDocuments = async (): Promise<{
	legalAcceptanceRequired: boolean;
	pendingDocuments: LegalDocument[];
}> => {
	const response = await http.get<ApiEnvelope<{
		legalAcceptanceRequired: boolean;
		pendingDocuments: LegalDocument[];
	}>>('/v1/auth/legal/required');

	return response.data.data;
};

export const acceptLegalDocuments = async (
	documents: string[] | { id: string; version: number }[]
): Promise<{
	legalAcceptanceRequired: boolean;
	pendingDocuments: LegalDocument[];
}> => {
	let acceptedDocuments: { id: string; version: number }[] = [];
	let documentIds: string[] = [];

	if (documents.length > 0) {
		if (typeof documents[0] === 'string') {
			documentIds = documents as string[];
			acceptedDocuments = documentIds.map((id) => ({ id, version: 1 }));
		} else {
			const docObjects = documents as { id: string; version: number }[];
			acceptedDocuments = docObjects;
			documentIds = docObjects.map((d) => d.id);
		}
	}

	const response = await http.post<ApiEnvelope<{
		legalAcceptanceRequired: boolean;
		pendingDocuments: LegalDocument[];
	}>>('/v1/auth/legal/accept', {
		acceptedDocuments,
		documentIds,
	});

	return response.data.data;
};

const getCookieValue = (cookieName: string): string | null => {
	const escaped = cookieName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
	return match ? decodeURIComponent(match[1]) : null;
};

export const logout = async (): Promise<void> => {
	const csrfCookieName = import.meta.env.VITE_CSRF_COOKIE_NAME || 'csrf_token';
	const csrfToken = getCookieValue(csrfCookieName);

	await http.post('/v1/auth/logout', {}, {
		headers: csrfToken ? { 'x-csrf-token': csrfToken } : undefined,
	});
};

export const becomeProvider = async (): Promise<AuthUser> => {
	const response = await http.post<ApiEnvelope<AuthUser>>('/v1/users/me/become-provider');
	return response.data.data;
};

const pickString = (...values: unknown[]): string => {
	for (const value of values) {
		if (typeof value === 'string' && value.trim()) {
			return value.trim();
		}
	}
	return '';
};

const extractUploadedDocumentUrl = (payload: unknown): string => {
	if (!payload || typeof payload !== 'object') return '';
	const record = payload as Record<string, unknown>;
	const nested = record.data && typeof record.data === 'object'
		? (record.data as Record<string, unknown>)
		: null;

	return pickString(
		record.url,
		record.fileUrl,
		record.file_url,
		record.documentUrl,
		record.document_url,
		record.signedUrl,
		record.signed_url,
		record.s3Url,
		record.s3_url,
		record.location,
		nested?.url,
		nested?.fileUrl,
		nested?.file_url,
		nested?.documentUrl,
		nested?.document_url,
		nested?.signedUrl,
		nested?.signed_url,
		nested?.s3Url,
		nested?.s3_url,
		nested?.location,
	);
};

const buildMultipartAuthHeaders = (): Record<string, string> => {
	const headers: Record<string, string> = {};
	const token = getAccessToken();
	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}
	const csrfToken = getCookieValue(import.meta.env.VITE_CSRF_COOKIE_NAME || 'csrf_token');
	if (csrfToken) {
		headers['x-csrf-token'] = csrfToken;
	}
	return headers;
};

/** Upload provider verification docs to S3 via POST /v1/provider/documents/upload */
export const uploadProviderDocument = async (formData: FormData): Promise<{ success: boolean; url: string }> => {
	const baseUrl = getApiBaseUrl().replace(/\/$/, '');
	const response = await fetch(`${baseUrl}/v1/provider/documents/upload`, {
		method: 'POST',
		body: formData,
		credentials: 'include',
		headers: buildMultipartAuthHeaders(),
	});

	let payload: unknown = null;
	try {
		payload = await response.json();
	} catch {
		payload = null;
	}

	if (!response.ok) {
		// Handle legal re-acceptance requirement (HTTP 428) — same logic as the axios
		// response interceptor in http.ts, which does NOT fire here because this
		// function uses native `fetch` instead of the axios `http` instance.
		if (response.status === 428 && typeof window !== 'undefined') {
			const errorCode = String(
				(payload && typeof payload === 'object'
					? ((payload as Record<string, unknown>).details as Record<string, unknown> | undefined)?.code
					: undefined) ?? '',
			);
			if (errorCode === 'LEGAL_REACCEPTANCE_REQUIRED') {
				const currentPath = `${window.location.pathname}${window.location.search}` || '/';
				if (!currentPath.startsWith('/auth/legal-accept')) {
					window.location.href = `/auth/legal-accept?returnTo=${encodeURIComponent(currentPath)}`;
					// Return a promise that never resolves so the caller doesn't see an error
					// while the browser navigates away.
					await new Promise(() => { /* navigation in progress */ });
				}
			}
		}

		const message =
			(payload && typeof payload === 'object'
				? pickString(
					(payload as Record<string, unknown>).message,
					(payload as Record<string, unknown>).error,
				)
				: '') || `Upload failed (${response.status})`;
		throw new Error(message);
	}

	const url = extractUploadedDocumentUrl(payload);
	if (!url) {
		throw new Error('No URL returned from upload API.');
	}
	return { success: true, url };
};
