import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('session')?.value;
  const pathname = request.nextUrl.pathname;

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/signup', '/verify', '/api/auth', '/api/webhooks'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // Admin routes
  const isAdminRoute = pathname.startsWith('/admin');

  // If accessing admin route, we'll check auth in the page component
  // (since we need to check user role from database)
  // For now, just let it through and handle in the page

  // API routes protection
  if (pathname.startsWith('/api/admin') && !session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Protected routes (require authentication)
  if (!isPublicRoute && !session && !pathname.startsWith('/api')) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

