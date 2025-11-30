/**
 * Auth Callback Route
 * Handles Supabase authentication callbacks for email confirmations and OAuth flows
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/dashboard';
  const error = requestUrl.searchParams.get('error');
  const error_description = requestUrl.searchParams.get('error_description');

  // 에러가 있으면 로그인 페이지로 리다이렉트
  if (error) {
    console.error('Auth callback error:', error, error_description);
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${encodeURIComponent(error_description || error)}`
    );
  }

  // Code가 있으면 토큰 교환 수행
  if (code) {
    const supabase = createClient();

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('Code exchange error:', exchangeError);
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=${encodeURIComponent(exchangeError.message)}`
      );
    }

    // 성공하면 next 파라미터로 지정된 경로 또는 대시보드로 리다이렉트
    return NextResponse.redirect(`${requestUrl.origin}${next}`);
  }

  // Code가 없으면 로그인 페이지로 리다이렉트
  return NextResponse.redirect(`${requestUrl.origin}/login`);
}
