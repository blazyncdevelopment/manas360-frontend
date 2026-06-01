import type { AxiosResponse } from 'axios';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
/** @deprecated Legacy key — read for migration only */
const LEGACY_TOKEN_KEY = 'token';

export type AuthTokens = {
	accessToken: string;
	refreshToken?: string;
};

const readStorage = (key: string): string | null => {
	try {
		return localStorage.getItem(key);
	} catch {
		return null;
	}
};

const writeStorage = (key: string, value: string): void => {
	try {
		localStorage.setItem(key, value);
	} catch (error) {
		console.warn(`Failed to set ${key} in localStorage`, error);
	}
};

const removeStorage = (key: string): void => {
	try {
		localStorage.removeItem(key);
	} catch (error) {
		console.warn(`Failed to remove ${key} from localStorage`, error);
	}
};

const stripBearerPrefix = (value: string): string => value.replace(/^Bearer\s+/i, '').trim();

const readHeaderToken = (headers: Record<string, unknown>, name: string): string | null => {
	const raw = headers[name] ?? headers[name.toLowerCase()];
	if (typeof raw !== 'string' || !raw.trim()) {
		return null;
	}
	return name.toLowerCase() === 'authorization' ? stripBearerPrefix(raw) : raw.trim();
};

/**
 * Extract JWTs from login/refresh responses (JSON body first, then CORS-exposed headers).
 */
export const extractTokensFromAuthResponse = (response: AxiosResponse): AuthTokens | null => {
	const bodyData = response.data?.data ?? response.data;
	const accessFromBody = bodyData?.accessToken ?? bodyData?.access_token;
	const refreshFromBody = bodyData?.refreshToken ?? bodyData?.refresh_token;

	const headers = (response.headers || {}) as Record<string, unknown>;
	const accessFromHeader =
		(typeof accessFromBody === 'string' && accessFromBody) ||
		readHeaderToken(headers, 'x-access-token') ||
		readHeaderToken(headers, 'authorization');

	const refreshFromHeader =
		(typeof refreshFromBody === 'string' && refreshFromBody) ||
		readHeaderToken(headers, 'x-refresh-token');

	if (!accessFromHeader) {
		return null;
	}

	return {
		accessToken: accessFromHeader,
		refreshToken: refreshFromHeader || undefined,
	};
};

export const persistAuthTokens = (tokens: AuthTokens): void => {
	writeStorage(ACCESS_TOKEN_KEY, tokens.accessToken);
	writeStorage(LEGACY_TOKEN_KEY, tokens.accessToken);
	if (tokens.refreshToken) {
		writeStorage(REFRESH_TOKEN_KEY, tokens.refreshToken);
	}
};

export const persistTokensFromAuthResponse = (response: AxiosResponse): boolean => {
	const tokens = extractTokensFromAuthResponse(response);
	if (!tokens) {
		return false;
	}
	persistAuthTokens(tokens);
	return true;
};

export const getAccessToken = (): string | null => {
	return (
		readStorage(ACCESS_TOKEN_KEY) ||
		readStorage(LEGACY_TOKEN_KEY)
	);
};

export const getRefreshToken = (): string | null => readStorage(REFRESH_TOKEN_KEY);

/** @deprecated Use getAccessToken */
export const getAuthToken = (): string => getAccessToken() || '';

export const getAuthHeaders = (): Record<string, string> => {
	const token = getAccessToken();
	if (!token) {
		return {};
	}
	return { Authorization: `Bearer ${token}` };
};

/** @deprecated Use persistAuthTokens */
export const setAuthToken = (token: string): void => {
	persistAuthTokens({ accessToken: token });
};

export const clearAuthTokens = (): void => {
	removeStorage(ACCESS_TOKEN_KEY);
	removeStorage(REFRESH_TOKEN_KEY);
	removeStorage(LEGACY_TOKEN_KEY);
};

/** @deprecated Use clearAuthTokens */
export const removeAuthToken = (): void => {
	clearAuthTokens();
};

export const hasStoredAccessToken = (): boolean => Boolean(getAccessToken());
