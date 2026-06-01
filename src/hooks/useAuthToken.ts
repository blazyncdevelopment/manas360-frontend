import { useEffect, useState } from 'react';
import { getAccessToken } from '../utils/authToken';

const ACCESS_TOKEN_KEY = 'accessToken';

export function useAuthToken() {
  const [token, setToken] = useState<string | null>(() => getAccessToken());

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === ACCESS_TOKEN_KEY || e.key === 'token') {
        setToken(getAccessToken());
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return { token, setToken };
}

export default useAuthToken;
