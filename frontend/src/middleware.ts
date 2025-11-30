/**
 * Next.js Middleware for Supabase Auth
 * Automatically refreshes authentication sessions and guards protected routes
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_PATHS = [
  '/dashboard',
  '/projects',
  '/templates',
  '/settings',
  '/onboarding',
  '/channels',
];

const AUTH_PATHS = ['/login', '/signup', '/reset-password'];

const matchesPath = (pathname: string, routes: string[]): boolean => {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
};

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 세션 새로고침 (필요한 경우 자동으로 토큰 갱신)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  const isProtectedRoute = matchesPath(pathname, PROTECTED_PATHS);
  const isAuthRoute = matchesPath(pathname, AUTH_PATHS);

  // 로그인하지 않은 사용자가 보호된 페이지 접근 시 로그인으로 리다이렉트
  if (isProtectedRoute && !user) {
    const redirectTarget = `${pathname}${search}`;
    const loginUrl = new URL('/login', request.url);
    if (redirectTarget && redirectTarget !== '/login') {
      loginUrl.searchParams.set('redirect', redirectTarget);
    }
    return NextResponse.redirect(loginUrl);
  }

  // 로그인한 사용자가 인증 페이지 접근 시 대시보드로 리다이렉트
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/projects/:path*',
    '/templates/:path*',
    '/settings/:path*',
    '/onboarding/:path*',
    '/channels/:path*',
    '/login',
    '/signup',
    '/reset-password',
  ],
};
