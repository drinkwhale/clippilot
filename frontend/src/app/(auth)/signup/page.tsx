/**
 * Signup Page
 * User registration with email/password (FR-021, FR-022)
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<
    'weak' | 'medium' | 'strong' | null
  >(null);

  const { signup, isLoading } = useAuth();

  const checkPasswordStrength = (pwd: string) => {
    if (pwd.length === 0) {
      setPasswordStrength(null);
      return;
    }

    const hasUpperCase = /[A-Z]/.test(pwd);
    const hasLowerCase = /[a-z]/.test(pwd);
    const hasNumbers = /\d/.test(pwd);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
    const length = pwd.length;

    const strength = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(
      Boolean
    ).length;

    if (length < 8) {
      setPasswordStrength('weak');
    } else if (strength >= 3 && length >= 10) {
      setPasswordStrength('strong');
    } else {
      setPasswordStrength('medium');
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pwd = e.target.value;
    setPassword(pwd);
    checkPasswordStrength(pwd);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password.length < 8) {
      setError('비밀번호는 최소 8자 이상이어야 합니다');
      return;
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다');
      return;
    }

    try {
      await signup({ email, password });
    } catch (err: any) {
      setError(err.message || '회원가입에 실패했습니다');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            ClipPilot 회원가입
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              로그인
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
                autoComplete="new-password"
                required
                value={password}
                onChange={handlePasswordChange}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="비밀번호 (최소 8자)"
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="sr-only">
                비밀번호 확인
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="비밀번호 확인"
              />
            </div>
          </div>

          {passwordStrength && (
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      passwordStrength === 'weak'
                        ? 'w-1/3 bg-red-500'
                        : passwordStrength === 'medium'
                        ? 'w-2/3 bg-yellow-500'
                        : 'w-full bg-green-500'
                    }`}
                  />
                </div>
                <span className="text-xs text-gray-600">
                  {passwordStrength === 'weak'
                    ? '약함'
                    : passwordStrength === 'medium'
                    ? '보통'
                    : '강함'}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                영문 대소문자, 숫자, 특수문자를 조합하면 더 안전합니다
              </p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '처리중...' : '회원가입'}
            </button>
          </div>

          <div className="text-xs text-gray-500 text-center">
            회원가입 시{' '}
            <Link href="/terms" className="text-blue-600 hover:text-blue-500">
              이용약관
            </Link>{' '}
            및{' '}
            <Link href="/privacy" className="text-blue-600 hover:text-blue-500">
              개인정보처리방침
            </Link>
            에 동의하는 것으로 간주됩니다
          </div>
        </form>
      </div>
    </div>
  );
}
