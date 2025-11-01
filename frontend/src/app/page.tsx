/**
 * Home Page (Landing)
 * Redirects to login or dashboard based on auth status
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();

  // 랜딩 페이지 컨텐츠
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            ClipPilot MVP
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            AI 숏폼 크리에이터 자동화 SaaS
          </p>
          <p className="text-lg text-gray-500 mb-12">
            키워드 입력만으로 스크립트 생성부터 YouTube 업로드까지 자동화
          </p>

          {/* CTA Buttons */}
          <div className="flex justify-center gap-4">
            <Link
              href="/signup"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              무료로 시작하기
            </Link>
            <Link
              href="/login"
              className="px-8 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              로그인
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="text-3xl mb-4">🤖</div>
            <h3 className="text-xl font-bold mb-2">AI 콘텐츠 생성</h3>
            <p className="text-gray-600">
              프롬프트 입력으로 스크립트, 자막, 메타데이터를 30초 이내 생성
            </p>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="text-3xl mb-4">🎬</div>
            <h3 className="text-xl font-bold mb-2">자동 영상 렌더링</h3>
            <p className="text-gray-600">
              스톡 영상과 자막을 결합하여 3분 이내 렌더링 완료
            </p>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="text-3xl mb-4">📺</div>
            <h3 className="text-xl font-bold mb-2">YouTube 자동 업로드</h3>
            <p className="text-gray-600">
              1클릭으로 YouTube 채널에 초안 업로드 및 관리
            </p>
          </div>
        </div>

        {/* Plans Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-8">요금제</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="p-6 bg-white rounded-lg shadow-lg border-2 border-gray-200">
              <h3 className="text-2xl font-bold mb-2">Free</h3>
              <div className="text-4xl font-bold mb-4">₩0</div>
              <ul className="text-left space-y-2 mb-6">
                <li>✓ 월 20회 생성</li>
                <li>✓ 1개 YouTube 채널</li>
                <li>✓ 기본 템플릿</li>
              </ul>
              <Link
                href="/signup"
                className="block w-full py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
              >
                시작하기
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="p-6 bg-white rounded-lg shadow-lg border-4 border-blue-600 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                인기
              </div>
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <div className="text-4xl font-bold mb-4">₩29,000</div>
              <ul className="text-left space-y-2 mb-6">
                <li>✓ 월 500회 생성</li>
                <li>✓ 3개 YouTube 채널</li>
                <li>✓ 모든 템플릿</li>
                <li>✓ 워터마크 제거</li>
              </ul>
              <Link
                href="/signup"
                className="block w-full py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                시작하기
              </Link>
            </div>

            {/* Agency Plan */}
            <div className="p-6 bg-white rounded-lg shadow-lg border-2 border-gray-200">
              <h3 className="text-2xl font-bold mb-2">Agency</h3>
              <div className="text-4xl font-bold mb-4">₩99,000</div>
              <ul className="text-left space-y-2 mb-6">
                <li>✓ 무제한 생성</li>
                <li>✓ 10개 YouTube 채널</li>
                <li>✓ 커스텀 템플릿</li>
                <li>✓ 우선 지원</li>
              </ul>
              <Link
                href="/signup"
                className="block w-full py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
              >
                시작하기
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
