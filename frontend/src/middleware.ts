/**
 * Next.js Middleware
 * Guards authenticated routes and redirects based on session state
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_COOKIE_NAME = 'cp_access_token';

const PROTECTED_PATHS = [
  '/dashboard',
  '/projects',
  '/templates',
  '/settings',
  '/onboarding',
  '/channels',
];

const AUTH_PATHS = ['/login', '/signup', '/reset-password'];

interface JWTPayload {
  exp?: number;
}

const decodeJwtPayload = (token: string): JWTPayload | null => {
  if (typeof atob !== 'function') {
    return null;
  }

  try {
    const [, payload] = token.split('.');
    if (!payload) return null;

    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');

    const jsonPayload = decodeURIComponent(
      atob(padded)
        .split('')
        .map((char) => `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join('')
    );

    return JSON.parse(jsonPayload) as JWTPayload;
  } catch {
    return null;
  }
};

const isTokenValid = (token: string | undefined): boolean => {
  if (!token) return false;

  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;

  const now = Math.floor(Date.now() / 1000);
  return payload.exp > now;
};

const matchesPath = (pathname: string, routes: string[]): boolean => {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
};

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const authToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const hasValidSession = isTokenValid(authToken);

  const isProtectedRoute = matchesPath(pathname, PROTECTED_PATHS);
  const isAuthRoute = matchesPath(pathname, AUTH_PATHS);

  if (isProtectedRoute && !hasValidSession) {
    const redirectTarget = `${pathname}${search}`;
    const loginUrl = new URL('/login', request.url);
    if (redirectTarget && redirectTarget !== '/login') {
      loginUrl.searchParams.set('redirect', redirectTarget);
    }

    const response = NextResponse.redirect(loginUrl);
    if (authToken) {
      response.cookies.delete({
        name: AUTH_COOKIE_NAME,
        path: '/',
      });
    }
    return response;
  }

  if (isAuthRoute && hasValidSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
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
