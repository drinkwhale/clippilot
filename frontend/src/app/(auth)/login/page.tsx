/**
 * Login Page
 * User authentication with email/password (FR-023)
 * Includes 3-attempt lockout and 15-minute lockout UI
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loginAttempts, setLoginAttempts] = useState<{
    attempts: number;
    max_attempts: number;
    locked: boolean;
    locked_until: string | null;
    remaining_attempts: number;
  } | null>(null);
  const [lockExpiresAt, setLockExpiresAt] = useState<Date | null>(null);
  const [lockCountdown, setLockCountdown] = useState('');

  const { login, isLoading, getLoginAttempts } = useAuth();

  const hasValidEmail = useMemo(() => email && email.includes('@'), [email]);

  const fetchLoginAttempts = useCallback(
    async (emailAddress: string) => {
      if (!emailAddress || !emailAddress.includes('@')) {
        setLoginAttempts(null);
        setLockExpiresAt(null);
        setLockCountdown('');
        return null;
      }

      const attempts = await getLoginAttempts(emailAddress);
      setLoginAttempts(attempts);
      return attempts;
    },
    [getLoginAttempts]
  );

  // Check login attempts when email changes
  useEffect(() => {
    if (hasValidEmail) {
      fetchLoginAttempts(email);
    } else {
      setLoginAttempts(null);
      setLockExpiresAt(null);
      setLockCountdown('');
    }
  }, [email, hasValidEmail, fetchLoginAttempts]);

  useEffect(() => {
    if (loginAttempts?.locked && loginAttempts.locked_until) {
      setLockExpiresAt(new Date(loginAttempts.locked_until));
    } else {
      setLockExpiresAt(null);
      setLockCountdown('');
    }
  }, [loginAttempts]);

  useEffect(() => {
    if (!lockExpiresAt) {
      return;
    }

    const updateCountdown = () => {
      const diff = lockExpiresAt.getTime() - Date.now();

      if (diff <= 0) {
        setLockCountdown('');
        setLockExpiresAt(null);

        if (hasValidEmail) {
          fetchLoginAttempts(email);
        }
        return;
      }

      const totalSeconds = Math.ceil(diff / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;

      setLockCountdown(
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    };

    updateCountdown();
    const intervalId = window.setInterval(updateCountdown, 1000);

    return () => window.clearInterval(intervalId);
  }, [lockExpiresAt, email, fetchLoginAttempts, hasValidEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!hasValidEmail) {
      setError('올바른 이메일을 입력해주세요');
      return;
    }

    // Check if account is locked
    if (loginAttempts?.locked) {
      setError('너무 많은 로그인 시도로 계정이 잠겼습니다.');
      return;
    }

    try {
      await login({ email, password });
      setLoginAttempts(null);
      setLockExpiresAt(null);
      setLockCountdown('');
    } catch (err: any) {
      setError(err.message || '로그인에 실패했습니다');

      // Refresh login attempts after failed login
      await fetchLoginAttempts(email);
    }
  };

  const remainingAttempts = useMemo(() => {
    if (!loginAttempts) return null;
    if (typeof loginAttempts.remaining_attempts === 'number') {
      return Math.max(loginAttempts.remaining_attempts, 0);
    }

    if (
      typeof loginAttempts.max_attempts === 'number' &&
      typeof loginAttempts.attempts === 'number'
    ) {
      return Math.max(loginAttempts.max_attempts - loginAttempts.attempts, 0);
    }

    return null;
  }, [loginAttempts]);

  const attemptsProgress = useMemo(() => {
    if (!loginAttempts) return 0;
    const max = loginAttempts.max_attempts || 3;
    if (max <= 0) return 0;

    return Math.min(100, Math.round((loginAttempts.attempts / max) * 100));
  }, [loginAttempts]);

  const isLocked = loginAttempts?.locked ?? false;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            ClipPilot 로그인
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            계정이 없으신가요?{' '}
            <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
              회원가입
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}

          {loginAttempts && loginAttempts.attempts > 0 && !isLocked && (
            <div className="rounded-md bg-yellow-50 p-4">
              <div className="flex">
                <div className="ml-3 w-full">
                  <h3 className="text-sm font-medium text-yellow-800">
                    로그인 시도 {loginAttempts.attempts}회 실패.
                    {typeof remainingAttempts === 'number' && (
                      <> {remainingAttempts}회 남았습니다.</>
                    )}
                  </h3>
                  <p className="text-xs text-yellow-700 mt-1">
                    {loginAttempts.max_attempts}회 실패 시 15분간 계정이 잠깁니다.
                  </p>
                  <div className="mt-3 h-2 w-full rounded bg-yellow-100">
                    <div
                      className="h-2 rounded bg-yellow-500 transition-all duration-300"
                      style={{ width: `${attemptsProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {isLocked && (
            <div className="rounded-md bg-red-50 p-4" role="alert" aria-live="assertive">
              <div className="flex flex-col space-y-2">
                <h3 className="text-sm font-medium text-red-800">계정이 잠겼습니다</h3>
                <p className="text-xs text-red-700">
                  너무 많은 로그인 시도가 감지되었습니다. 15분 후 다시 시도해주세요.
                </p>
                {lockCountdown && (
                  <p className="text-xs font-semibold text-red-700">
                    남은 시간: <span className="tabular-nums">{lockCountdown}</span>
                  </p>
                )}
                {!lockCountdown && loginAttempts?.locked_until && (
                  <p className="text-xs text-red-700">
                    {new Date(loginAttempts.locked_until).toLocaleString('ko-KR')} 이후 다시
                    시도해주세요.
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                이메일
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="이메일"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="비밀번호"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                로그인 상태 유지
              </label>
            </div>

            <div className="text-sm">
              <Link
                href="/reset-password"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                비밀번호 찾기
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || isLocked}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '처리중...' : '로그인'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
