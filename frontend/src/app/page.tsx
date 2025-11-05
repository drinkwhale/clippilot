/**
 * Home Page (Landing)
 * Linear.app 스타일의 모던한 랜딩 페이지
 */

'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background-primary">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-header border-b border-border-primary backdrop-blur-xl bg-background-primary/80">
        <div className="max-w-page mx-auto px-6 h-header flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-title2 font-bold text-foreground-primary">
              ClipPilot
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="#features" className="text-regular text-foreground-secondary hover:text-foreground-primary transition-colors">
                기능
              </Link>
              <Link href="#pricing" className="text-regular text-foreground-secondary hover:text-foreground-primary transition-colors">
                요금제
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                로그인
              </Button>
            </Link>
            <Link href="/signup">
              <Button variant="primary" size="sm">
                무료로 시작하기
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-prose mx-auto text-center">
          <Badge variant="info" className="mb-6">
            🚀 AI 기반 자동화
          </Badge>

          <h1 className="text-title6 md:text-title7 font-bold text-foreground-primary mb-6 leading-tight">
            키워드 입력만으로
            <br />
            <span className="bg-gradient-to-r from-brand via-accent-hover to-accent bg-clip-text text-transparent">
              YouTube 숏폼 자동 생성
            </span>
          </h1>

          <p className="text-large text-foreground-secondary mb-10 max-w-xl mx-auto">
            AI가 스크립트를 작성하고, 영상을 렌더링하고, YouTube에 업로드까지.
            <br />
            콘텐츠 제작의 모든 과정을 자동화하세요.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link href="/signup">
              <Button variant="primary" size="lg" className="min-w-[200px]">
                무료로 시작하기 →
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="secondary" size="lg" className="min-w-[200px]">
                자세히 알아보기
              </Button>
            </Link>
          </div>

          <div className="flex items-center justify-center gap-8 text-small text-foreground-tertiary">
            <div className="flex items-center gap-2">
              <span className="text-status-green">✓</span>
              신용카드 불필요
            </div>
            <div className="flex items-center gap-2">
              <span className="text-status-green">✓</span>
              월 20회 무료
            </div>
            <div className="flex items-center gap-2">
              <span className="text-status-green">✓</span>
              언제든 업그레이드
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 border-t border-border-primary">
        <div className="max-w-page mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-title4 font-bold text-foreground-primary mb-4">
              3단계로 완성되는 숏폼 콘텐츠
            </h2>
            <p className="text-large text-foreground-secondary">
              복잡한 편집 없이, AI가 모든 과정을 자동화합니다
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-background-secondary border border-border-primary rounded-xl p-8 hover:border-border-secondary transition-all">
              <div className="w-12 h-12 rounded-lg bg-brand/10 flex items-center justify-center mb-6">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="text-title3 font-semibold text-foreground-primary mb-3">
                AI 콘텐츠 생성
              </h3>
              <p className="text-regular text-foreground-tertiary mb-4">
                키워드만 입력하면 GPT-4o가 매력적인 스크립트와 자막, 메타데이터를 30초 이내에 생성합니다.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="default" size="sm">GPT-4o</Badge>
                <Badge variant="default" size="sm">30초 이내</Badge>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-background-secondary border border-border-primary rounded-xl p-8 hover:border-border-secondary transition-all">
              <div className="w-12 h-12 rounded-lg bg-status-blue/10 flex items-center justify-center mb-6">
                <span className="text-2xl">🎬</span>
              </div>
              <h3 className="text-title3 font-semibold text-foreground-primary mb-3">
                자동 영상 렌더링
              </h3>
              <p className="text-regular text-foreground-tertiary mb-4">
                Pexels 스톡 영상과 자막을 자동으로 결합하여 전문가 수준의 영상을 3분 이내에 완성합니다.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="default" size="sm">FFmpeg</Badge>
                <Badge variant="default" size="sm">3분 완성</Badge>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-background-secondary border border-border-primary rounded-xl p-8 hover:border-border-secondary transition-all">
              <div className="w-12 h-12 rounded-lg bg-status-green/10 flex items-center justify-center mb-6">
                <span className="text-2xl">📺</span>
              </div>
              <h3 className="text-title3 font-semibold text-foreground-primary mb-3">
                YouTube 자동 업로드
              </h3>
              <p className="text-regular text-foreground-tertiary mb-4">
                완성된 영상을 1클릭으로 YouTube 채널에 초안 업로드. 언제든 수정 후 게시할 수 있습니다.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="default" size="sm">YouTube API</Badge>
                <Badge variant="default" size="sm">1클릭 업로드</Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 border-t border-border-primary">
        <div className="max-w-page mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-title4 font-bold text-foreground-primary mb-4">
              합리적인 가격, 강력한 기능
            </h2>
            <p className="text-large text-foreground-secondary">
              무료로 시작하고, 필요할 때 업그레이드하세요
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="bg-background-secondary border border-border-primary rounded-xl p-8 flex flex-col">
              <div className="mb-6">
                <h3 className="text-title2 font-bold text-foreground-primary mb-2">
                  Free
                </h3>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-title5 font-bold text-foreground-primary">₩0</span>
                  <span className="text-small text-foreground-tertiary">/월</span>
                </div>
                <p className="text-small text-foreground-tertiary">
                  개인 사용자를 위한 무료 플랜
                </p>
              </div>

              <ul className="space-y-3 mb-8 flex-grow">
                <li className="flex items-start gap-3 text-regular text-foreground-secondary">
                  <span className="text-status-green mt-0.5">✓</span>
                  월 20회 생성
                </li>
                <li className="flex items-start gap-3 text-regular text-foreground-secondary">
                  <span className="text-status-green mt-0.5">✓</span>
                  1개 YouTube 채널 연동
                </li>
                <li className="flex items-start gap-3 text-regular text-foreground-secondary">
                  <span className="text-status-green mt-0.5">✓</span>
                  기본 템플릿 사용
                </li>
                <li className="flex items-start gap-3 text-regular text-foreground-secondary">
                  <span className="text-status-green mt-0.5">✓</span>
                  커뮤니티 지원
                </li>
              </ul>

              <Link href="/signup" className="block">
                <Button variant="secondary" size="md" fullWidth>
                  시작하기
                </Button>
              </Link>
            </div>

            {/* Pro Plan - Featured */}
            <div className="bg-background-secondary border-2 border-brand rounded-xl p-8 flex flex-col relative shadow-high">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge variant="primary" size="md">
                  가장 인기있는
                </Badge>
              </div>

              <div className="mb-6">
                <h3 className="text-title2 font-bold text-foreground-primary mb-2">
                  Pro
                </h3>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-title5 font-bold text-foreground-primary">₩29,000</span>
                  <span className="text-small text-foreground-tertiary">/월</span>
                </div>
                <p className="text-small text-foreground-tertiary">
                  전문 크리에이터를 위한 플랜
                </p>
              </div>

              <ul className="space-y-3 mb-8 flex-grow">
                <li className="flex items-start gap-3 text-regular text-foreground-secondary">
                  <span className="text-status-green mt-0.5">✓</span>
                  월 500회 생성
                </li>
                <li className="flex items-start gap-3 text-regular text-foreground-secondary">
                  <span className="text-status-green mt-0.5">✓</span>
                  3개 YouTube 채널 연동
                </li>
                <li className="flex items-start gap-3 text-regular text-foreground-secondary">
                  <span className="text-status-green mt-0.5">✓</span>
                  모든 템플릿 사용
                </li>
                <li className="flex items-start gap-3 text-regular text-foreground-secondary">
                  <span className="text-status-green mt-0.5">✓</span>
                  워터마크 제거
                </li>
                <li className="flex items-start gap-3 text-regular text-foreground-secondary">
                  <span className="text-status-green mt-0.5">✓</span>
                  우선 이메일 지원
                </li>
              </ul>

              <Link href="/signup" className="block">
                <Button variant="primary" size="md" fullWidth>
                  시작하기
                </Button>
              </Link>
            </div>

            {/* Agency Plan */}
            <div className="bg-background-secondary border border-border-primary rounded-xl p-8 flex flex-col">
              <div className="mb-6">
                <h3 className="text-title2 font-bold text-foreground-primary mb-2">
                  Agency
                </h3>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-title5 font-bold text-foreground-primary">₩99,000</span>
                  <span className="text-small text-foreground-tertiary">/월</span>
                </div>
                <p className="text-small text-foreground-tertiary">
                  에이전시와 팀을 위한 플랜
                </p>
              </div>

              <ul className="space-y-3 mb-8 flex-grow">
                <li className="flex items-start gap-3 text-regular text-foreground-secondary">
                  <span className="text-status-green mt-0.5">✓</span>
                  무제한 생성
                </li>
                <li className="flex items-start gap-3 text-regular text-foreground-secondary">
                  <span className="text-status-green mt-0.5">✓</span>
                  10개 YouTube 채널 연동
                </li>
                <li className="flex items-start gap-3 text-regular text-foreground-secondary">
                  <span className="text-status-green mt-0.5">✓</span>
                  커스텀 템플릿 제작
                </li>
                <li className="flex items-start gap-3 text-regular text-foreground-secondary">
                  <span className="text-status-green mt-0.5">✓</span>
                  전담 계정 매니저
                </li>
                <li className="flex items-start gap-3 text-regular text-foreground-secondary">
                  <span className="text-status-green mt-0.5">✓</span>
                  24/7 우선 지원
                </li>
              </ul>

              <Link href="/signup" className="block">
                <Button variant="secondary" size="md" fullWidth>
                  문의하기
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 border-t border-border-primary">
        <div className="max-w-prose mx-auto text-center">
          <h2 className="text-title4 font-bold text-foreground-primary mb-4">
            지금 바로 시작하세요
          </h2>
          <p className="text-large text-foreground-secondary mb-8">
            신용카드 없이 무료로 시작할 수 있습니다
          </p>
          <Link href="/signup">
            <Button variant="primary" size="lg">
              무료로 시작하기 →
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-primary py-12 px-6">
        <div className="max-w-page mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-regular text-foreground-tertiary">
              © 2025 ClipPilot. All rights reserved.
            </div>
            <div className="flex items-center gap-6">
              <Link href="#" className="text-regular text-foreground-tertiary hover:text-foreground-primary transition-colors">
                서비스 약관
              </Link>
              <Link href="#" className="text-regular text-foreground-tertiary hover:text-foreground-primary transition-colors">
                개인정보 처리방침
              </Link>
              <Link href="#" className="text-regular text-foreground-tertiary hover:text-foreground-primary transition-colors">
                문의하기
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
