import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const isWeb = Platform.OS === 'web';

const KEYS = {
  ACCESS_TOKEN: 'scannel_access_token',
  REFRESH_TOKEN: 'scannel_refresh_token',
  USER_PROFILE: 'scannel_user_profile',
} as const;

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  companyId: string | null;
  companyName: string | null;
  userCode: string | null;
}

// In-browser local storage fallback for web development
const webStorage = {
  getItem: (key: string): string | null => {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem(key);
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, value);
    }
  },
  removeItem: (key: string): void => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(key);
    }
  },
};

export async function setTokens(access: string, refresh: string): Promise<void> {
  if (isWeb) {
    webStorage.setItem(KEYS.ACCESS_TOKEN, access);
    webStorage.setItem(KEYS.REFRESH_TOKEN, refresh);
    return;
  }
  await Promise.all([
    SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, access),
    SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, refresh),
  ]);
}

export async function getAccessToken(): Promise<string | null> {
  if (isWeb) {
    return webStorage.getItem(KEYS.ACCESS_TOKEN);
  }
  // Check if SecureStore is supported/available on current native client configuration
  try {
    return await SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);
  } catch {
    return null;
  }
}

export async function getRefreshToken(): Promise<string | null> {
  if (isWeb) {
    return webStorage.getItem(KEYS.REFRESH_TOKEN);
  }
  try {
    return await SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
  } catch {
    return null;
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  if (isWeb) {
    webStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
    return;
  }
  await SecureStore.setItemAsync(KEYS.USER_PROFILE, JSON.stringify(profile));
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const profileStr = isWeb 
    ? webStorage.getItem(KEYS.USER_PROFILE) 
    : await (async () => {
        try {
          return await SecureStore.getItemAsync(KEYS.USER_PROFILE);
        } catch {
          return null;
        }
      })();

  if (!profileStr) return null;
  try {
    return JSON.parse(profileStr) as UserProfile;
  } catch {
    return null;
  }
}

export async function clearCredentials(): Promise<void> {
  if (isWeb) {
    webStorage.removeItem(KEYS.ACCESS_TOKEN);
    webStorage.removeItem(KEYS.REFRESH_TOKEN);
    webStorage.removeItem(KEYS.USER_PROFILE);
    return;
  }
  try {
    await Promise.all([
      SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN),
      SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN),
      SecureStore.deleteItemAsync(KEYS.USER_PROFILE),
    ]);
  } catch (e) {
    console.warn('Failed to clear credentials from SecureStore', e);
  }
}
