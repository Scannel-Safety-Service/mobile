import Constants from 'expo-constants';
import { getAccessToken, getRefreshToken, setTokens, clearCredentials } from './secure-store';

const getBaseUrl = () => {
  // 1. Prioritize environment variable if set (in .env, eas.json, or build env)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // 2. Try to resolve Metro bundler IP address in development
  const debuggerHost = Constants.expoConfig?.hostUri;
  const ip = debuggerHost?.split(':')?.[0];

  if (__DEV__ && ip) {
    return `http://${ip}:8000/api/v1`;
  }

  // 3. Fallback for standalone builds without explicit API_URL
  return 'http://localhost:8000/api/v1';
};

export const API_URL = getBaseUrl();

// Global handler to trigger logout when token refresh fails
let onUnauthorizedError: (() => void) | null = null;

export function registerUnauthorizedHandler(handler: () => void) {
  onUnauthorizedError = handler;
}

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  refreshQueue.forEach((promise) => {
    if (token) {
      promise.resolve(token);
    } else {
      promise.reject(error);
    }
  });
  refreshQueue = [];
};

async function handleRefresh(): Promise<string> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-client-type': 'mobile',
      Authorization: `Bearer ${refreshToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Refresh token request failed');
  }

  const result = await response.json();
  const tokens = result.data;
  
  await setTokens(tokens.accessToken, tokens.refreshToken);
  return tokens.accessToken;
}

export async function apiRequest(path: string, options: RequestOptions = {}): Promise<Response> {
  const url = `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = new Headers(options.headers || {});
  
  // Set default client identifier header
  headers.set('x-client-type', 'mobile');
  
  const isMultipart = options.body && (
    options.body instanceof FormData || 
    (typeof options.body === 'object' && 'append' in (options.body as any)) ||
    (options.body.constructor && options.body.constructor.name === 'FormData')
  );
  
  if (!headers.has('Content-Type') && !isMultipart) {
    headers.set('Content-Type', 'application/json');
  }

  // Inject Bearer token if not explicitly skipped
  if (!options.skipAuth) {
    const accessToken = await getAccessToken();
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }
  }

  const plainHeaders: Record<string, string> = {};
  headers.forEach((value, key) => {
    plainHeaders[key] = value;
  });

  const fetchOptions: RequestInit = {
    ...options,
    headers: plainHeaders,
  };

  const response = await fetch(url, fetchOptions);

  if (response.status === 401 && !options.skipAuth) {
    // If already refreshing, queue this request
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      })
        .then((newAccessToken) => {
          headers.set('Authorization', `Bearer ${newAccessToken}`);
          const retryHeaders: Record<string, string> = {};
          headers.forEach((value, key) => {
            retryHeaders[key] = value;
          });
          return fetch(url, { ...fetchOptions, headers: retryHeaders });
        })
        .catch((error) => {
          throw error;
        });
    }

    isRefreshing = true;

    try {
      const newAccessToken = await handleRefresh();
      processQueue(null, newAccessToken);
      
      // Retry original request with the new access token
      headers.set('Authorization', `Bearer ${newAccessToken}`);
      const retryHeaders: Record<string, string> = {};
      headers.forEach((value, key) => {
        retryHeaders[key] = value;
      });
      return await fetch(url, { ...fetchOptions, headers: retryHeaders });
    } catch (refreshError) {
      processQueue(refreshError, null);
      
      // Refresh token is invalid or expired — clear storage and logout
      await clearCredentials();
      if (onUnauthorizedError) {
        onUnauthorizedError();
      }
      
      throw new Error('Session expired. Please log in again.');
    } finally {
      isRefreshing = false;
    }
  }

  return response;
}
