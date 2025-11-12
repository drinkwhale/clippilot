/**
 * Auth Store using Zustand
 * Manages authentication state across the application
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const AUTH_COOKIE_NAME = 'cp_access_token';

interface JWTPayload {
  exp?: number;
}

const decodeJwtPayload = (token: string): JWTPayload | null => {
  if (typeof atob !== 'function') {
    return null;
  }

  try {
    const [, payload] = token.split('.');
    if (!payload) return null;

    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');

    const jsonPayload = decodeURIComponent(
      atob(padded)
        .split('')
        .map((char) => `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join('')
    );

    return JSON.parse(jsonPayload) as JWTPayload;
  } catch {
    return null;
  }
};

const setAuthCookie = (token: string) => {
  if (typeof document === 'undefined') return;

  let maxAge = 60 * 60; // default 1 hour
  const payload = decodeJwtPayload(token);
  if (payload?.exp) {
    const now = Math.floor(Date.now() / 1000);
    const remaining = payload.exp - now;
    if (remaining <= 0) {
      maxAge = 0;
    } else {
      maxAge = remaining;
    }
  }

  const isSecure =
    typeof window !== 'undefined' && window.location.protocol === 'https:';
  const cookieSuffix = `; path=/; samesite=lax${isSecure ? '; secure' : ''}`;

  if (maxAge <= 0) {
    document.cookie = `${AUTH_COOKIE_NAME}=; max-age=0${cookieSuffix}`;
    return;
  }

  document.cookie = `${AUTH_COOKIE_NAME}=${token}; max-age=${maxAge}${cookieSuffix}`;
};

const clearAuthCookie = () => {
  if (typeof document === 'undefined') return;

  const isSecure =
    typeof window !== 'undefined' && window.location.protocol === 'https:';

  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0; samesite=lax${
    isSecure ? '; secure' : ''
  }`;
};

const storeAccessToken = (token: string | null) => {
  if (typeof window === 'undefined') return;

  if (token) {
    localStorage.setItem('access_token', token);
  } else {
    localStorage.removeItem('access_token');
  }
};

interface User {
  id: string;
  email: string;
  plan: 'free' | 'pro' | 'agency';
  oauth_provider: 'email' | 'google';
  is_active: boolean;
  email_verified: boolean;
  last_login_at: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  _hasHydrated: boolean;

  // Actions
  setAuth: (user: User, accessToken: string) => void;
  clearAuth: () => void;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  updateOnboardingStatus: (completed: boolean) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      _hasHydrated: false,

      setAuth: (user, accessToken) =>
        set(() => {
          storeAccessToken(accessToken);
          setAuthCookie(accessToken);

          return {
            user,
            accessToken,
            isAuthenticated: true,
            isLoading: false,
          };
        }),

      clearAuth: () =>
        set(() => {
          storeAccessToken(null);
          clearAuthCookie();

          return {
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
          };
        }),

      setUser: (user) =>
        set({ user }),

      setLoading: (loading) =>
        set({ isLoading: loading }),

      updateOnboardingStatus: (completed) =>
        set((state) => ({
          user: state.user
            ? { ...state.user, onboarding_completed: completed }
            : null,
        })),

      setHasHydrated: (hasHydrated) =>
        set({ _hasHydrated: hasHydrated }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
