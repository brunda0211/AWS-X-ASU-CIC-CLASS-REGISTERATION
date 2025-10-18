/**
 * SECURITY: Session verification utilities for server-side authentication
 * 
 * Provides secure session validation for:
 * - API routes
 * - Server components
 * - Middleware
 * - Protected pages
 */

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import type { SessionUser } from '@/lib/auth';

/**
 * SECURITY: Get authenticated session on server-side
 * 
 * @returns Promise<SessionUser | null> - User session or null if not authenticated
 */
export async function getAuthSession(): Promise<SessionUser | null> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return null;
    }
    
    // SECURITY: Return only safe user data
    return {
      email: session.user.email,
      name: session.user.name,
      studentId: session.user.studentId,
    };
  } catch (error) {
    console.error('Session verification error:', error);
    return null;
  }
}

/**
 * SECURITY: Verify user is authenticated (throws if not)
 * 
 * @returns Promise<SessionUser> - Authenticated user session
 * @throws Error if not authenticated
 */
export async function requireAuth(): Promise<SessionUser> {
  const session = await getAuthSession();
  
  if (!session) {
    throw new Error('Authentication required');
  }
  
  return session;
}

/**
 * SECURITY: Check if user is authenticated (boolean)
 * 
 * @returns Promise<boolean> - True if authenticated, false otherwise
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getAuthSession();
  return session !== null;
}

/**
 * SECURITY: Get user email from session (safe)
 * 
 * @returns Promise<string | null> - User email or null if not authenticated
 */
export async function getCurrentUserEmail(): Promise<string | null> {
  const session = await getAuthSession();
  return session?.email || null;
}

/**
 * SECURITY: Verify user owns resource by email
 * 
 * @param resourceEmail - Email associated with the resource
 * @returns Promise<boolean> - True if user owns resource, false otherwise
 */
export async function verifyResourceOwnership(resourceEmail: string): Promise<boolean> {
  const session = await getAuthSession();
  
  if (!session) {
    return false;
  }
  
  return session.email === resourceEmail;
}

/**
 * SECURITY: Create middleware-compatible session check
 * 
 * @param request - Request object (for future use with middleware)
 * @returns Promise<SessionUser | null> - User session or null
 */
export async function getSessionForMiddleware(): Promise<SessionUser | null> {
  // For now, use the same logic as getAuthSession
  // In the future, this could be optimized for middleware use
  return getAuthSession();
}