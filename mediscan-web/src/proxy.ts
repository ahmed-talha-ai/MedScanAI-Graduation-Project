import createMiddleware from 'next-intl/middleware';
import { type NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';
import { decodeToken, isTokenExpired } from './lib/auth';

const intlMiddleware = createMiddleware(routing);

// Routes accessible by multiple roles (checked before prefix routes)
const MULTI_ROLE_ROUTES: Record<string, string[]> = {
  '/dashboard/self-exam': ['Patient', 'Doctor'],
  '/doctor/examination': ['Patient', 'Doctor'],
  '/examinations': ['Patient', 'Doctor'],
  '/dashboard/ai-tools': ['Patient', 'Doctor'],
  '/settings': ['Patient', 'Doctor', 'Admin'],
};

// Protected app routes and allowed roles (prefix-based)
const PROTECTED_ROUTES: Record<string, string[]> = {
  '/dashboard': ['Patient'],
  '/doctor': ['Doctor'],
  '/admin': ['Admin'],
  '/onboarding': ['Patient'],
};

// Auth routes that redirect away if already authed
const AUTH_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/confirm-email',
];

function getRoleRedirect(role: string): string {
  switch (role) {
    case 'Patient': return '/dashboard';
    case 'Doctor': return '/doctor';
    case 'Admin': return '/admin';
    default: return '/login';
  }
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Strip locale prefix
  const localeMatch = pathname.match(/^\/(ar|en)(\/.*)?$/);
  const locale = localeMatch ? localeMatch[1] : 'ar';
  const rawPath = localeMatch ? (localeMatch[2] || '/') : pathname;

  const token = request.cookies.get('mediscan_token')?.value;

  let role: string | null = null;

  if (token && !isTokenExpired(token)) {
    const decoded = decodeToken(token);
    role = decoded?.role ?? null;
  }

  const isAuthed = !!role;
  const isAuthRoute = AUTH_ROUTES.some((r) => rawPath.startsWith(r));

  // Already authed → redirect away from auth pages
  if (isAuthed && isAuthRoute) {
    return NextResponse.redirect(new URL(`/${locale}${getRoleRedirect(role!)}`, request.url));
  }

  // Multi-role route check (exact prefix match, highest priority)
  const multiRoleEntry = Object.entries(MULTI_ROLE_ROUTES).find(([route]) =>
    rawPath === route || rawPath.startsWith(route + '/')
  );

  if (multiRoleEntry) {
    const [, allowedRoles] = multiRoleEntry;
    if (!isAuthed) {
      const dest = new URL(`/${locale}/login`, request.url);
      dest.searchParams.set('redirect', rawPath);
      return NextResponse.redirect(dest);
    }
    if (!allowedRoles.includes(role!)) {
      return NextResponse.redirect(
        new URL(`/${locale}${getRoleRedirect(role!)}`, request.url)
      );
    }
    return intlMiddleware(request);
  }

  // Protected route checks (prefix-based, single-role)
  const protectedEntry = Object.entries(PROTECTED_ROUTES).find(([route]) =>
    rawPath === route || rawPath.startsWith(route + '/')
  );

  if (protectedEntry) {
    const [, allowedRoles] = protectedEntry;

    if (!isAuthed) {
      const dest = new URL(`/${locale}/login`, request.url);
      dest.searchParams.set('redirect', rawPath);
      return NextResponse.redirect(dest);
    }

    if (!allowedRoles.includes(role!)) {
      return NextResponse.redirect(
        new URL(`/${locale}${getRoleRedirect(role!)}`, request.url)
      );
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    // Match all paths except Next.js internals and static files
    '/((?!_next|_vercel|api|.*\\..*).*)',
  ],
};
