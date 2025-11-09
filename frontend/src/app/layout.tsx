/**
 * Root Layout
 * Next.js 14 App Router requires a root layout
 */

import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { logEnvironmentValidation } from '@/lib/env-validation';

// 환경 변수 검증 실행 (서버 사이드에서만)
if (typeof window === 'undefined') {
  logEnvironmentValidation();
}

export const metadata: Metadata = {
  title: 'ClipPilot - AI 숏폼 크리에이터 자동화',
  description: 'AI 기반 YouTube 숏폼 비디오 자동 생성 플랫폼',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
