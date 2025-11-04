'use client';

/**
 * Linear 테마 프로바이더
 * 앱 전역에 Linear 테마를 적용하는 컴포넌트
 */

import { useEffect } from 'react';
import { applyLinearTheme } from '@/lib/theme/theme-loader';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  useEffect(() => {
    // 클라이언트 사이드에서 CSS 변수 적용
    applyLinearTheme();
  }, []);

  return <>{children}</>;
}
