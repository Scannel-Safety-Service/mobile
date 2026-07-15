import { create } from 'zustand';
import { 
  UserProfile, 
  setTokens, 
  getAccessToken, 
  getRefreshToken, 
  saveUserProfile, 
  getUserProfile, 
  clearCredentials 
} from '@/lib/secure-store';
import { API_URL, registerUnauthorizedHandler } from '@/lib/api';

export function decodeJwt(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    // URL-safe base64 decode the payload
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '=='.slice(0, (4 - base64.length % 4) % 4);
    const decoded = atob(padded);
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    return null;
  }
}

interface AuthState {
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
  accessToken: string | null;
  user: UserProfile | null;
  loginError: string | null;

  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Wire up the unauthorized logout handler (called by api.ts when refresh fails)
  registerUnauthorizedHandler(() => {
    clearCredentials();
    set({ status: 'unauthenticated', accessToken: null, user: null });
  });

  return {
    status: 'idle',
    accessToken: null,
    user: null,
    loginError: null,

    clearError: () => set({ loginError: null }),

    initialize: async () => {
      set({ status: 'loading' });
      try {
        const accessToken = await getAccessToken();
        const refreshToken = await getRefreshToken();
        const user = await getUserProfile();

        if (accessToken && refreshToken && user) {
          const decoded = decodeJwt(accessToken);
          if (decoded && decoded.exp * 1000 > Date.now()) {
            // Token is still valid — restore session
            set({ status: 'authenticated', accessToken, user });
            return;
          }

          // Access token expired — try to silently refresh
          try {
            const response = await fetch(`${API_URL}/auth/refresh`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-client-type': 'mobile',
                Authorization: `Bearer ${refreshToken}`,
              },
            });

            if (response.ok) {
              const result = await response.json();
              const tokens = result.data;
              const newDecoded = decodeJwt(tokens.accessToken);
              const refreshedUser: UserProfile = {
                id: newDecoded.sub,
                email: user.email,
                firstName: newDecoded.firstName || user.firstName,
                lastName: newDecoded.lastName || user.lastName,
                role: newDecoded.role,
                companyId: newDecoded.companyId,
                companyName: newDecoded.companyName || user.companyName || null,
                userCode: newDecoded.userCode || user.userCode || null,
              };

              await setTokens(tokens.accessToken, tokens.refreshToken);
              await saveUserProfile(refreshedUser);
              set({ status: 'authenticated', accessToken: tokens.accessToken, user: refreshedUser });
              return;
            }
          } catch (err) {
            console.warn('Silent refresh failed during initialization', err);
          }
        }
      } catch (e) {
        console.warn('Initialization read failed:', e);
      }

      // No valid session — clear any stale data and send to login
      await clearCredentials();
      set({ status: 'unauthenticated', accessToken: null, user: null });
    },

    login: async (email, password) => {
      // Use a local loading flag — do NOT set global status to 'loading'
      // because that would unmount the login form and hide error messages.
      set({ loginError: null });
      try {
        const response = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-client-type': 'mobile',
          },
          body: JSON.stringify({ email, password }),
        });

        const result = await response.json();

        if (!response.ok) {
          // Map backend error messages to user-friendly text
          let errorMessage = 'Invalid email or password. Please try again.';
          if (response.status === 403) {
            errorMessage = result.message || 'Admin accounts must log in via the web portal.';
          } else if (response.status === 401) {
            const msg = result.message || '';
            if (msg.toLowerCase().includes('inactive') || msg.toLowerCase().includes('archived')) {
              errorMessage = 'Your account is inactive. Please contact your administrator.';
            } else if (msg.toLowerCase().includes('company')) {
              errorMessage = 'Your company account has been disabled. Please contact support.';
            } else {
              errorMessage = 'Invalid email or password. Please try again.';
            }
          } else if (response.status === 429) {
            errorMessage = 'Too many attempts. Please wait a moment and try again.';
          }

          set({ loginError: errorMessage });
          return false;
        }

        const tokens = result.data;
        const decoded = decodeJwt(tokens.accessToken);

        if (!decoded) {
          set({ loginError: 'Login failed: invalid server response. Please try again.' });
          return false;
        }

        // Build user profile from JWT claims directly (no /users/me endpoint needed)
        // firstName and lastName come from token claims if the backend includes them,
        // otherwise default gracefully — they can be enriched later.
        const user: UserProfile = {
          id: decoded.sub,
          email,
          firstName: decoded.firstName || decoded.name?.split(' ')?.[0] || 'Employee',
          lastName: decoded.lastName || decoded.name?.split(' ')?.slice(1).join(' ') || '',
          role: decoded.role,
          companyId: decoded.companyId,
          companyName: decoded.companyName || null,
          userCode: decoded.userCode || null,
        };

        await setTokens(tokens.accessToken, tokens.refreshToken);
        await saveUserProfile(user);

        set({ status: 'authenticated', accessToken: tokens.accessToken, user, loginError: null });
        return true;
      } catch (error) {
        console.error('Login network error:', error);
        set({ loginError: 'Cannot connect to server. Please check your connection.' });
        return false;
      }
    },

    logout: async () => {
      const refreshToken = await getRefreshToken();
      if (refreshToken) {
        // Best-effort server-side revocation — don't block local logout on failure
        fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-client-type': 'mobile',
          },
          body: JSON.stringify({ refreshToken }),
        }).catch((e) => console.warn('Logout revocation failed (offline?):', e));
      }
      await clearCredentials();
      set({ status: 'unauthenticated', accessToken: null, user: null, loginError: null });
    },
  };
});
