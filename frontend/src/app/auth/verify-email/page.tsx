/**
 * Email Verification Page
 * 회원가입 후 이메일 확인 안내 페이지
 */

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    setEmail(emailParam);
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
            이메일을 확인해주세요
          </h2>
          {email && (
            <p className="text-lg text-gray-600 mb-6">
              <span className="font-semibold">{email}</span>로<br />
              확인 이메일이 발송되었습니다.
            </p>
          )}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700">
              📧 이메일 확인 링크를 클릭하면<br />
              자동으로 로그인됩니다.
            </p>
          </div>
          <div className="space-y-3 text-sm text-gray-600">
            <p>이메일이 도착하지 않았나요?</p>
            <ul className="space-y-2 text-left list-disc list-inside">
              <li>스팸 폴더를 확인해주세요</li>
              <li>이메일 주소가 정확한지 확인해주세요</li>
              <li>몇 분 정도 소요될 수 있습니다</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/login"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            ← 로그인 페이지로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
