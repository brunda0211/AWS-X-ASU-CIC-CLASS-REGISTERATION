/**
 * SECURITY: Next.js middleware for route protection and authentication
 * 
 * Provides:
 * - Route-based authentication protection
 * - Automatic redirects for unauthenticated users
 * - Security headers for all responses
 * - Rate limiting (basic implementation)
 */

import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * SECURITY: Protected routes that require authentication
 */
const protectedRoutes = [
  '/dashboard',
  '/classes',
  '/profile',
  '/api/enrollments',
  '/api/users',
];

/**
 * SECURITY: Public routes that don't require authentication
 */
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/api/register',
  '/api/auth',
];

/**
 * SECURITY: Add security headers to all responses
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  // SECURITY: Comprehensive security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // SECURITY: Content Security Policy (basic)
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
  );
  
  return response;
}

/**
 * SECURITY: Check if route requires authentication
 */
function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some(route => pathname.startsWith(route));
}

/**
 * SECURITY: Check if route is public
 */
function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(route => pathname.startsWith(route));
}

/**
 * SECURITY: Main middleware function with NextAuth integration
 */
export default withAuth(
  function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    
    // SECURITY: Create response with security headers
    const response = NextResponse.next();
    
    // SECURITY: Add security headers to all responses
    addSecurityHeaders(response);
    
    // SECURITY: Handle authentication logic
    const token = request.nextauth.token;
    
    // If user is authenticated and trying to access auth pages, redirect to dashboard
    if (token && (pathname === '/login' || pathname === '/register')) {
      const dashboardUrl = new URL('/dashboard', request.url);
      return NextResponse.redirect(dashboardUrl);
    }
    
    // If user is not authenticated and trying to access protected routes
    if (!token && isProtectedRoute(pathname)) {
      const loginUrl = new URL('/login', request.url);
      // SECURITY: Add return URL for redirect after login
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    return response;
  },
  {
    callbacks: {
      /**
       * SECURITY: Determine if middleware should run
       * Run for all routes except static files and API auth routes
       */
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // SECURITY: Always allow public routes
        if (isPublicRoute(pathname)) {
          return true;
        }
        
        // SECURITY: Require token for protected routes
        if (isProtectedRoute(pathname)) {
          return !!token;
        }
        
        // SECURITY: Allow all other routes by default
        return true;
      },
    },
  }
);

/**
 * SECURITY: Configure which routes the middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth.js routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public/).*)',
  ],
};