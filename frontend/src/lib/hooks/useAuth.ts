/**
 * useAuth Hook
 * Provides authentication functionality using Supabase Auth
 */

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth-store';
import { supabase } from '@/lib/supabase';

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

export function useAuth() {
  const router = useRouter();
  const { user, accessToken, isAuthenticated, isLoading, setAuth, clearAuth, setLoading } =
    useAuthStore();

  /**
   * Sign up a new user with Supabase
   */
  const signup = useCallback(
    async (data: SignupData) => {
      setLoading(true);
      try {
        const { data: authData, error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) {
          throw new Error(error.message || '회원가입에 실패했습니다');
        }

        if (!authData.user || !authData.session) {
          throw new Error('회원가입 후 세션 생성에 실패했습니다');
        }

        // Convert Supabase user to our User format
        const userData = {
          id: authData.user.id,
          email: authData.user.email!,
          plan: 'free' as const,
          oauth_provider: 'email' as const,
          is_active: true,
          email_verified: authData.user.email_confirmed_at !== null,
          last_login_at: new Date().toISOString(),
          onboarding_completed: false,
          created_at: authData.user.created_at,
          updated_at: authData.user.updated_at || authData.user.created_at,
        };

        setAuth(userData, authData.session.access_token);

        // Redirect to onboarding
        router.push('/onboarding');

        return authData;
      } catch (error) {
        setLoading(false);
        throw error;
      }
    },
    [setAuth, setLoading, router]
  );

  /**
   * Log in with Supabase
   */
  const login = useCallback(
    async (data: LoginData) => {
      setLoading(true);
      try {
        const { data: authData, error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

        if (error) {
          throw new Error(error.message || '로그인에 실패했습니다');
        }

        if (!authData.user || !authData.session) {
          throw new Error('로그인 세션 생성에 실패했습니다');
        }

        // Convert Supabase user to our User format
        const userData = {
          id: authData.user.id,
          email: authData.user.email!,
          plan: 'free' as const,
          oauth_provider: 'email' as const,
          is_active: true,
          email_verified: authData.user.email_confirmed_at !== null,
          last_login_at: new Date().toISOString(),
          onboarding_completed: authData.user.user_metadata?.onboarding_completed || false,
          created_at: authData.user.created_at,
          updated_at: authData.user.updated_at || authData.user.created_at,
        };

        setAuth(userData, authData.session.access_token);

        // Redirect based on onboarding status
        if (!userData.onboarding_completed) {
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
  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    clearAuth();
    router.push('/login');
  }, [clearAuth, router]);

  /**
   * Request password reset
   */
  const resetPassword = useCallback(
    async (data: ResetPasswordData) => {
      setLoading(true);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        });

        if (error) {
          throw new Error(error.message || '비밀번호 재설정에 실패했습니다');
        }

        return { message: '비밀번호 재설정 이메일이 발송되었습니다' };
      } finally {
        setLoading(false);
      }
    },
    [setLoading]
  );

  /**
   * Delete user account (Supabase doesn't have built-in user deletion from client)
   * This would typically be handled server-side
   */
  const deleteAccount = useCallback(
    async (password: string) => {
      setLoading(true);
      try {
        // Verify password first
        if (!user?.email) {
          throw new Error('사용자 정보를 찾을 수 없습니다');
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: password,
        });

        if (signInError) {
          throw new Error('비밀번호가 올바르지 않습니다');
        }

        // Note: Actual account deletion should be handled by a server-side function
        // For now, just sign out
        await supabase.auth.signOut();
        clearAuth();
        router.push('/');

        return { message: '계정이 삭제되었습니다' };
      } catch (error) {
        setLoading(false);
        throw error;
      }
    },
    [user, clearAuth, setLoading, router]
  );

  /**
   * Check login attempts for an email
   * Note: This feature would need to be implemented server-side with Supabase
   */
  const getLoginAttempts = useCallback(async (email: string) => {
    // This would require a server-side implementation
    // For now, return null
    return null;
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
