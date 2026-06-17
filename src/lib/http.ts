import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
	clearAuthTokens,
	getAccessToken,
	getAuthHeaders,
	getRefreshToken,
	persistTokensFromAuthResponse,
} from '../utils/authToken';
import { getApiBaseUrl } from './runtimeEnv';

const baseURL = getApiBaseUrl();

const normalizeApiUrl = (url: string): string => {
	if (!url || /^https?:\/\//i.test(url) || url.startsWith('/api/')) {
		return url;
	}

	if (
		url === '/health' || 
		url === '/metrics' || 
		url.startsWith('/chat/') || 
		url.startsWith('/webhooks/') ||
		url.startsWith('/help-center') ||
		url.startsWith('/support-chat') ||
		url.startsWith('/submit-contact')
	) {
		return url;
	}

	if (url.startsWith('/v1/')) {
		return url;
	}

	if (url.startsWith('/')) {
		return `/v1${url}`;
	}

	return `/v1/${url}`;
};

const getCookieValue = (cookieName: string): string | null => {
	if (typeof document === 'undefined') {
		return null;
	}

	const escaped = cookieName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
	return match ? decodeURIComponent(match[1]) : null;
};

let refreshPromise: Promise<void> | null = null;

const isAuthRoute = (url: string): boolean => (
	url.includes('/auth/login')
	|| url.includes('/auth/logout')
	|| url.includes('/auth/refresh')
	|| url.includes('/auth/me')
	|| url.includes('/auth/password/')
);

const isTokenIssuingAuthRoute = (url: string): boolean => (
	url.includes('/auth/login')
	|| url.includes('/auth/verify/phone-otp')
	|| url.includes('/provider-onboarding/verify-otp')
	|| url.includes('/auth/refresh')
	|| url.includes('/corporate/public/create-account')
);

const refreshAccessToken = async (): Promise<void> => {
	if (refreshPromise) {
		return refreshPromise;
	}

	refreshPromise = (async () => {
		const csrfCookieName = import.meta.env.VITE_CSRF_COOKIE_NAME || 'csrf_token';
		const csrfToken = getCookieValue(csrfCookieName);
		const storedRefreshToken = getRefreshToken();

		const response = await axios.post(
			`${baseURL}/v1/auth/refresh`,
			{},
			{
				withCredentials: true,
				headers: {
					...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
					...(storedRefreshToken ? { 'x-refresh-token': storedRefreshToken } : {}),
				},
			},
		);

		persistTokensFromAuthResponse(response);
	})();

	try {
		await refreshPromise;
	} finally {
		refreshPromise = null;
	}
};

let httpInstance: AxiosInstance | any;
if (axios && typeof (axios as any).create === 'function') {
	httpInstance = (axios as any).create({
		baseURL,
		withCredentials: true,
		headers: {
			'Content-Type': 'application/json',
		},
	});
} else if (axios) {
	// In test mocks axios may be an object with get/post helpers but no create function.
	// Fall back to using the axios object directly so tests can mock `get`.
	httpInstance = axios as any;
} else {
	httpInstance = {} as any;
}

export const http = httpInstance as AxiosInstance;

if (http && http.interceptors && http.interceptors.request && typeof http.interceptors.request.use === 'function') {
	http.interceptors.request.use((config: any) => {
		if (typeof config?.url === 'string') {
			config.url = normalizeApiUrl(config.url);
		}

		const authHeaders = getAuthHeaders();
		if (authHeaders.Authorization) {
			config.headers = Object.assign(config.headers || {}, authHeaders);
		}

		const csrfCookieName = import.meta.env.VITE_CSRF_COOKIE_NAME || 'csrf_token';
		const csrfToken = getCookieValue(csrfCookieName);
		if (csrfToken) {
			config.headers = Object.assign(config.headers || {}, { 'x-csrf-token': csrfToken });
		}

		// Must run after header merges — axios defaults Content-Type to application/json which breaks FormData uploads.
		if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
			if (config.headers?.set) {
				config.headers.set('Content-Type', false);
			} else if (config.headers) {
				delete config.headers['Content-Type'];
			}
		}

		return config;
	});
}

const isExpectedAuthFailure = (status: number | undefined, url: string): boolean => {
	if (!status) return false;
	if (status === 401 && url.includes('/auth/me')) return true;
	if ((status === 401 || status === 403) && url.includes('/v1/admin/pricing')) return true;
	return false;
};

if (http && http.interceptors && http.interceptors.response && typeof http.interceptors.response.use === 'function') {
	http.interceptors.response.use(
		(response: AxiosResponse) => {
			const baseUrl = response.config?.baseURL || '';
			const relativeUrl = normalizeApiUrl(response.config?.url || '');
			const fullUrl = `${baseUrl}${relativeUrl}`;

			if (isTokenIssuingAuthRoute(fullUrl)) {
				persistTokensFromAuthResponse(response);
			}

			return response;
		},
		async (error: any) => {
			const status: number | undefined = error?.response?.status;
			const baseUrl = error?.config?.baseURL || '';
			const relativeUrl = normalizeApiUrl(error?.config?.url || '');
			const fullUrl = `${baseUrl}${relativeUrl}`;
			const errorCode = String(error?.response?.data?.details?.code || '');

			(error as any).isExpectedAuthFailure = isExpectedAuthFailure(status, fullUrl);

			const originalRequest = error?.config as (typeof error.config & { _retry?: boolean }) | undefined;
			if (status === 428 && errorCode === 'LEGAL_REACCEPTANCE_REQUIRED' && typeof window !== 'undefined') {
				const currentPath = `${window.location.pathname}${window.location.search}` || '/';
				if (!currentPath.startsWith('/auth/legal-accept')) {
					const returnTo = encodeURIComponent(currentPath || '/');
					window.location.href = `/auth/legal-accept?returnTo=${returnTo}`;
				}
			}

			if (status === 401 && originalRequest && !originalRequest._retry && !isAuthRoute(fullUrl)) {
				originalRequest._retry = true;
				try {
					await refreshAccessToken();
					const accessToken = getAccessToken();
					if (accessToken) {
						originalRequest.headers = Object.assign(originalRequest.headers || {}, {
							Authorization: `Bearer ${accessToken}`,
						});
					}
					return http(originalRequest as any);
				} catch {
					clearAuthTokens();
					// Let the original 401 bubble up when refresh is unavailable/expired.
				}
			}

			return Promise.reject(error);
		},
	);
}
