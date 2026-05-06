import { withAuth } from 'next-auth/middleware';
import { NextRequest } from 'next/server';

/**
 * Middleware for protecting routes with Next-Auth
 *
 * Protected routes:
 * - / (dashboard)
 * - /api/* (all API routes except auth)
 *
 * Public routes:
 * - /auth/* (sign in, error pages)
 * - /_next/* (Next.js internals)
 */
export default withAuth(
  function middleware(req: NextRequest) {
    // Custom middleware logic can be added here if needed
    // For now, just protect the routes
    return;
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/auth/signin',
      error: '/auth/error',
    },
  },
);

/**
 * Configure which routes should be protected
 *
 * matcher patterns:
 * - '/:path*' matches root and all sub-paths
 * - except paths starting with /auth and /api/auth
 */
export const config = {
  matcher: [
    // Protect the dashboard
    '/',
    // Protect most API routes (except auth routes)
    '/api/:path*',
    // Exclude auth and static routes
    '/((?!auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
