/**
 * Auth Store 테스트
 *
 * 테스트 범위 (testing-strategy.md Phase 3 - T038):
 * - Zustand Auth Store 기능 검증
 * - 사용자 인증 상태 관리
 * - LocalStorage 영속성
 * - Cookie 설정
 */

import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '@/lib/stores/auth-store';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock document.cookie
let documentCookies = '';
Object.defineProperty(document, 'cookie', {
  get: () => documentCookies,
  set: (value: string) => {
    documentCookies = value;
  },
});

describe('Auth Store', () => {
  beforeEach(() => {
    // Clear store before each test
    act(() => {
      useAuthStore.getState().clearAuth();
    });
    localStorageMock.clear();
    documentCookies = '';
  });

  describe('초기 상태', () => {
    it('should initialize with null user', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.user).toBeNull();
      expect(result.current.accessToken).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('setAuth', () => {
    it('should update user and token on login', () => {
      const { result } = renderHook(() => useAuthStore());

      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        plan: 'free' as const,
        oauth_provider: 'email' as const,
        is_active: true,
        email_verified: true,
        last_login_at: null,
        onboarding_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZXhwIjoxNzAwMDAwMDAwfQ.signature';

      act(() => {
        result.current.setAuth(mockUser, mockToken);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.accessToken).toBe(mockToken);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    it('should store token in localStorage', () => {
      const { result } = renderHook(() => useAuthStore());

      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        plan: 'free' as const,
        oauth_provider: 'email' as const,
        is_active: true,
        email_verified: true,
        last_login_at: null,
        onboarding_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockToken = 'test-token';

      act(() => {
        result.current.setAuth(mockUser, mockToken);
      });

      expect(localStorage.getItem('access_token')).toBe(mockToken);
    });
  });

  describe('clearAuth', () => {
    it('should clear user on logout', () => {
      const { result } = renderHook(() => useAuthStore());

      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        plan: 'free' as const,
        oauth_provider: 'email' as const,
        is_active: true,
        email_verified: true,
        last_login_at: null,
        onboarding_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Set auth first
      act(() => {
        result.current.setAuth(mockUser, 'test-token');
      });

      // Then clear
      act(() => {
        result.current.clearAuth();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.accessToken).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it('should remove token from localStorage', () => {
      const { result } = renderHook(() => useAuthStore());

      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        plan: 'free' as const,
        oauth_provider: 'email' as const,
        is_active: true,
        email_verified: true,
        last_login_at: null,
        onboarding_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Set auth first
      act(() => {
        result.current.setAuth(mockUser, 'test-token');
      });

      expect(localStorage.getItem('access_token')).toBe('test-token');

      // Then clear
      act(() => {
        result.current.clearAuth();
      });

      expect(localStorage.getItem('access_token')).toBeNull();
    });
  });

  describe('setUser', () => {
    it('should update user data', () => {
      const { result } = renderHook(() => useAuthStore());

      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        plan: 'free' as const,
        oauth_provider: 'email' as const,
        is_active: true,
        email_verified: true,
        last_login_at: null,
        onboarding_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      act(() => {
        result.current.setUser(mockUser);
      });

      expect(result.current.user).toEqual(mockUser);
    });
  });

  describe('setLoading', () => {
    it('should update loading state', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('updateOnboardingStatus', () => {
    it('should update onboarding completed status', () => {
      const { result } = renderHook(() => useAuthStore());

      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        plan: 'free' as const,
        oauth_provider: 'email' as const,
        is_active: true,
        email_verified: true,
        last_login_at: null,
        onboarding_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Set auth first
      act(() => {
        result.current.setAuth(mockUser, 'test-token');
      });

      // Update onboarding status
      act(() => {
        result.current.updateOnboardingStatus(true);
      });

      expect(result.current.user?.onboarding_completed).toBe(true);
    });

    it('should not crash when user is null', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.updateOnboardingStatus(true);
      });

      expect(result.current.user).toBeNull();
    });
  });

  describe('persistence', () => {
    it.skip('should persist auth state to localStorage', async () => {
      const { result } = renderHook(() => useAuthStore());

      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        plan: 'free' as const,
        oauth_provider: 'email' as const,
        is_active: true,
        email_verified: true,
        last_login_at: null,
        onboarding_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockToken = 'test-token';

      act(() => {
        result.current.setAuth(mockUser, mockToken);
      });

      // Wait for persist to complete (Zustand persist is async)
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Check if state is persisted in localStorage
      const stored = localStorage.getItem('auth-storage');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.state.user).toEqual(mockUser);
      expect(parsed.state.accessToken).toBe(mockToken);
      expect(parsed.state.isAuthenticated).toBe(true);
    });
  });
});
