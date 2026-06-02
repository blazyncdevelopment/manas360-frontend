
// const APP_API_BASE_URL = 'https://www.api.manas360.com/api';

const APP_API_BASE_URL = 'https://api.manas360.com/api';
//https://api.manas360.com/api/
const getWindowOrigin = (): string => {
  if (typeof window === 'undefined') {
    return 'https://www.manas360.com';
  }

  return window.location.origin;
};

const stripTrailingApiSegment = (value: string): string => value.replace(/\/api\/?$/i, '');

const getDefaultWebsocketUrl = (): string => {
  const origin = getWindowOrigin();
  let wsUrl = origin.replace(/^https:/i, 'wss:').replace(/^http:/i, 'ws:');
  
  if (import.meta.env.DEV && wsUrl.includes('localhost')) {
    wsUrl = wsUrl.replace(/:\d+$/, ':5001');
  }
  
  return wsUrl;
};

const toWebsocketOrigin = (value: string): string => value.replace(/^https:/i, 'wss:').replace(/^http:/i, 'ws:');

export const API_BASE = '/api';

export const API_MDC_BASE = '/api/mdc';

export const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL?.trim() || getWindowOrigin();

export const WS_BASE = import.meta.env.VITE_WS_URL?.trim() || getDefaultWebsocketUrl();

<<<<<<< HEAD
export const AI_ENGINE_WS_URL = import.meta.env.VITE_AI_ENGINE_WS_URL?.trim() || `${toWebsocketOrigin(stripTrailingApiSegment(FRONTEND_URL))}/ai-engine`;
=======
export const AI_ENGINE_WS_URL =
  import.meta.env.VITE_AI_ENGINE_WS_URL?.trim() ||
  `${toWebsocketOrigin(stripTrailingApiSegment(FRONTEND_URL))}/ai-engine`;
>>>>>>> 2edb61731ee07e18056f066c12e2559d94da58a0

const getWindowCapacitor = (): any => {
  if (typeof window === 'undefined') {
    return null;
  }
  return (window as any).Capacitor || null;
};

export const isNativeApp = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  const protocol = String(window.location.protocol || '').toLowerCase();
  if (protocol === 'capacitor:') {
    return true;
  }

  const capacitor = getWindowCapacitor();
  if (!capacitor) {
    return false;
  }

  if (typeof capacitor.isNativePlatform === 'function') {
    return Boolean(capacitor.isNativePlatform());
  }

  if (typeof capacitor.getPlatform === 'function') {
    const platform = String(capacitor.getPlatform() || '').toLowerCase();
    return platform === 'android' || platform === 'ios';
  }

  return false;
};

export const getApiBaseUrl = (): string => {
<<<<<<< HEAD
  const appEnv = String(import.meta.env.VITE_APP_ENV || '').trim().toLowerCase();
  if (import.meta.env.DEV || appEnv === 'development') {
    return 'https://api.manas360.com/api';
  }
=======
  // 1. Tunnel override — set VITE_LOCAL_TUNNEL_URL in .env when needed, leave blank otherwise
  const tunnelUrl = import.meta.env.VITE_LOCAL_TUNNEL_URL?.trim();
  if (tunnelUrl) return `${tunnelUrl}/api`;
>>>>>>> 2edb61731ee07e18056f066c12e2559d94da58a0

  // 2. Explicit base URL from .env (covers local dev and production)
  const envBase = import.meta.env.VITE_API_BASE_URL?.trim();
  if (envBase) {
    return envBase;
  }

<<<<<<< HEAD
  const envApi = import.meta.env.VITE_API_URL?.trim();
  if (envApi) {
    return envApi;
  }

  if (isNativeApp()) {
    return APP_API_BASE_URL;
  }
=======
  // 3. Native app fallback
  if (isNativeApp()) return APP_API_BASE_URL;
>>>>>>> 2edb61731ee07e18056f066c12e2559d94da58a0

  return '/api';
};

// const APP_API_BASE_URL = 'https://api.manas360.com/api';

// const getWindowOrigin = (): string => {
//   if (typeof window === 'undefined') {
//     return 'https://www.manas360.com';
//   }
//   return window.location.origin;
// };

// const stripTrailingApiSegment = (value: string): string =>
//   value.replace(/\/api\/?$/i, '');

// const getDefaultWebsocketUrl = (): string => {
//   const origin = getWindowOrigin();
//   let wsUrl = origin.replace(/^https:/i, 'wss:').replace(/^http:/i, 'ws:');
//   if (import.meta.env.DEV && wsUrl.includes('localhost')) {
//     wsUrl = wsUrl.replace(/:\d+$/, ':5001');
//   }
//   return wsUrl;
// };

// const toWebsocketOrigin = (value: string): string =>
//   value.replace(/^https:/i, 'wss:').replace(/^http:/i, 'ws:');

// export const API_BASE = '/api';
// export const API_MDC_BASE = '/api/mdc';

// export const FRONTEND_URL =
//   import.meta.env.VITE_FRONTEND_URL?.trim() || getWindowOrigin();

// export const WS_BASE =
//   import.meta.env.VITE_WS_URL?.trim() || getDefaultWebsocketUrl();

// export const AI_ENGINE_WS_URL =
//   import.meta.env.VITE_AI_ENGINE_WS_URL?.trim() ||
//   `${toWebsocketOrigin(stripTrailingApiSegment(FRONTEND_URL))}/ai-engine`;

// // ── Local dev tunnel ──────────────────────────────────────────
// const LOCAL_TUNNEL_URL = 'https://9lc0tr74-4000.inc1.devtunnels.ms';
// // Set this to true while you want to test against the tunnel.
// const USE_LOCAL_TUNNEL = true;
// // ─────────────────────────────────────────────────────────────

// const getWindowCapacitor = (): any => {
//   if (typeof window === 'undefined') return null;
//   return (window as any).Capacitor || null;
// };

// export const isNativeApp = (): boolean => {
//   if (typeof window === 'undefined') return false;

//   const protocol = String(window.location.protocol || '').toLowerCase();
//   if (protocol === 'capacitor:') return true;

//   const capacitor = getWindowCapacitor();
//   if (!capacitor) return false;

//   if (typeof capacitor.isNativePlatform === 'function') {
//     return Boolean(capacitor.isNativePlatform());
//   }

//   if (typeof capacitor.getPlatform === 'function') {
//     const platform = String(capacitor.getPlatform() || '').toLowerCase();
//     return platform === 'android' || platform === 'ios';
//   }

//   return false;
// };

// export const getApiBaseUrl = (): string => {
//   // 1. Local tunnel override — flip USE_LOCAL_TUNNEL when done testing
//   if (USE_LOCAL_TUNNEL) {
//     return `${LOCAL_TUNNEL_URL}/api`;
//   }

//   // 2. Dev / explicit env vars
//   const appEnv = String(import.meta.env.VITE_APP_ENV || '').trim().toLowerCase();
//   if (import.meta.env.DEV || appEnv === 'development') {
//     return 'https://api.manas360.com/api';
//   }

//   const envBase = import.meta.env.VITE_API_BASE_URL?.trim();
//   if (envBase) return envBase;

//   const envApi = import.meta.env.VITE_API_URL?.trim();
//   if (envApi) return envApi;

//   if (isNativeApp()) return APP_API_BASE_URL;

//   return '/api';
// };