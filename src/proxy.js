import { NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE_NAME } from './lib/session.js';
import { USER_ROLES } from './lib/constants.js';

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  // Only protect platform /superadmin and tenant /tenant routes
  const isSuperAdminRoute = pathname.startsWith('/superadmin');
  const isTenantRoute = pathname.startsWith('/tenant');

  if (!isSuperAdminRoute && !isTenantRoute) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    // Unauthenticated user
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, code: 'UNAUTHORIZED', message: 'Authentication required.' },
        { status: 401 }
      );
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Superadmin route authorization
  if (isSuperAdminRoute && session.role !== USER_ROLES.SUPER_ADMIN) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, code: 'FORBIDDEN', message: 'Superadmin privileges required.' },
        { status: 403 }
      );
    }
    return NextResponse.redirect(new URL('/tenant/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/superadmin/:path*',
    '/tenant/:path*',
  ],
};
