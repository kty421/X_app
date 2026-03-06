import { create } from 'zustand';

import { type XCurrentUser } from '@/src/api/xApi';
import { clearAuthToken, readAuthToken, saveAuthToken, type StoredAuthToken } from '@/src/auth/tokenStorage';

type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface AuthStoreState {
  status: AuthStatus;
  token: StoredAuthToken | null;
  user: XCurrentUser | null;
  lastError?: string;
  bootstrap: () => Promise<void>;
  setAuthenticated: (token: StoredAuthToken, user?: XCurrentUser | null) => Promise<void>;
  setUser: (user: XCurrentUser | null) => void;
  logout: () => Promise<void>;
  markAuthError: (message: string) => void;
}

const isStoredTokenExpired = (token?: StoredAuthToken | null): boolean => {
  if (!token?.expiresAt) return false;
  return Date.now() >= token.expiresAt;
};

export const useAuthStore = create<AuthStoreState>((set, get) => ({
  status: 'idle',
  token: null,
  user: null,
  lastError: undefined,
  bootstrap: async () => {
    set({ status: 'loading', lastError: undefined });

    const storedToken = await readAuthToken();
    if (!storedToken) {
      set({ status: 'unauthenticated', token: null, user: null });
      return;
    }

    if (!isStoredTokenExpired(storedToken)) {
      set({ status: 'authenticated', token: storedToken, user: null });
      return;
    }

    if (storedToken.refreshToken) {
      try {
        const { buildRedirectUri, refreshAccessToken } = await import('@/src/auth/xAuth');
        const refreshed = await refreshAccessToken(storedToken.refreshToken, buildRedirectUri());
        await saveAuthToken(refreshed);
        set({ status: 'authenticated', token: refreshed, user: null });
        return;
      } catch {
        await clearAuthToken();
      }
    }

    set({ status: 'unauthenticated', token: null, user: null });
  },
  setAuthenticated: async (token, user) => {
    await saveAuthToken(token);
    set({
      status: 'authenticated',
      token,
      user: user ?? get().user,
      lastError: undefined,
    });
  },
  setUser: (user) => {
    set({ user });
  },
  logout: async () => {
    await clearAuthToken();
    set({
      status: 'unauthenticated',
      token: null,
      user: null,
      lastError: undefined,
    });
  },
  markAuthError: (message) => {
    set({ lastError: message });
  },
}));
