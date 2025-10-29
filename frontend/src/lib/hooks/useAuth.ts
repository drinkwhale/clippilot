/**
 * useAuth Hook
 * Provides authentication functionality and state management
 */

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';

interface SignupData {
  email: string;
  password: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface ResetPasswordData {
  email: string;
}

interface AuthResponse {
  access_token: string;
  token_type: string;
  user: {
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
  };
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function useAuth() {
  const router = useRouter();
  const { user, accessToken, isAuthenticated, isLoading, setAuth, clearAuth, setLoading } =
    useAuthStore();

  /**
   * Sign up a new user
   */
  const signup = useCallback(
    async (data: SignupData) => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error?.message || '회원가입에 실패했습니다');
        }

        const authData: AuthResponse = await response.json();
        setAuth(authData.user, authData.access_token);

        // Redirect to onboarding or dashboard
        if (!authData.user.onboarding_completed) {
          router.push('/onboarding');
        } else {
          router.push('/dashboard');
        }

        return authData;
      } catch (error) {
        setLoading(false);
        throw error;
      }
    },
    [setAuth, setLoading, router]
  );

  /**
   * Log in an existing user
   */
  const login = useCallback(
    async (data: LoginData) => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const error = await response.json();

          // Handle account locked error (status 423)
          if (response.status === 423) {
            throw new Error(error.error?.message || '계정이 잠겼습니다');
          }

          throw new Error(error.error?.message || '로그인에 실패했습니다');
        }

        const authData: AuthResponse = await response.json();
        setAuth(authData.user, authData.access_token);

        // Redirect to onboarding or dashboard
        if (!authData.user.onboarding_completed) {
          router.push('/onboarding');
        } else {
          router.push('/dashboard');
        }

        return authData;
      } catch (error) {
        setLoading(false);
        throw error;
      }
    },
    [setAuth, setLoading, router]
  );

  /**
   * Log out the current user
   */
  const logout = useCallback(() => {
    clearAuth();
    router.push('/login');
  }, [clearAuth, router]);

  /**
   * Request password reset
   */
  const resetPassword = useCallback(async (data: ResetPasswordData) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || '비밀번호 재설정에 실패했습니다');
      }

      const result = await response.json();
      return result;
    } finally {
      setLoading(false);
    }
  }, [setLoading]);

  /**
   * Delete user account
   */
  const deleteAccount = useCallback(
    async (password: string) => {
      if (!accessToken) {
        throw new Error('로그인이 필요합니다');
      }

      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/account`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            password,
            confirmation: 'DELETE',
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error?.message || '계정 삭제에 실패했습니다');
        }

        // Clear auth and redirect to home
        clearAuth();
        router.push('/');

        return await response.json();
      } catch (error) {
        setLoading(false);
        throw error;
      }
    },
    [accessToken, clearAuth, setLoading, router]
  );

  /**
   * Check login attempts for an email
   */
  const getLoginAttempts = useCallback(async (email: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/auth/login-attempts?email=${encodeURIComponent(email)}`
      );

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get login attempts:', error);
      return null;
    }
  }, []);

  return {
    // State
    user,
    accessToken,
    isAuthenticated,
    isLoading,

    // Actions
    signup,
    login,
    logout,
    resetPassword,
    deleteAccount,
    getLoginAttempts,
  };
}
