/**
 * SECURITY: NextAuth.js configuration with comprehensive security measures
 * 
 * CRITICAL SECURITY FEATURES:
 * - JWT strategy for stateless sessions (scalable)
 * - HttpOnly cookies (prevents XSS token theft)
 * - Secure cookies in production (HTTPS only)
 * - SameSite: 'lax' (CSRF protection)
 * - Generic error messages (prevents account enumeration)
 * - Input validation with Zod schemas
 * - Rate limiting for authentication attempts
 */

import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getUserByEmail } from '@/lib/db';
import { verifyPassword, checkRateLimit, clearRateLimit } from '@/lib/auth';
import { loginSchema } from '@/lib/validations';
import { SESSION_CONFIG } from '@/lib/constants';

/**
 * SECURITY: NextAuth configuration with comprehensive security measures
 */
export const authOptions: NextAuthOptions = {
  // SECURITY: Use JWT strategy for stateless, scalable sessions
  session: {
    strategy: 'jwt',
    maxAge: SESSION_CONFIG.MAX_AGE, // 30 days
    updateAge: SESSION_CONFIG.UPDATE_AGE, // 1 hour
  },

  // SECURITY: Configure providers with proper validation
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        email: {
          label: 'Email',
          type: 'email',
          placeholder: 'your.email@example.com',
        },
        password: {
          label: 'Password',
          type: 'password',
        },
      },

      /**
       * SECURITY: Secure authorization function with comprehensive validation
       * 
       * @param credentials - User-provided login credentials
       * @returns User object if valid, null if invalid (GENERIC errors only)
       */
      async authorize(credentials) {
        try {
          // SECURITY: Validate input format with Zod schema
          const validationResult = loginSchema.safeParse(credentials);

          if (!validationResult.success) {
            console.log('Login attempt with invalid input format');
            // SECURITY: Return null with generic error (don't reveal validation details)
            return null;
          }

          const { email, password } = validationResult.data;

          // SECURITY: Rate limiting to prevent brute force attacks
          if (!checkRateLimit(email, 5, 15 * 60 * 1000)) { // 5 attempts per 15 minutes
            console.log(`Rate limit exceeded for email: ${email}`);
            // SECURITY: Return null with generic error (don't reveal rate limiting)
            return null;
          }

          // SECURITY: Get user from database (returns null if not found)
          const user = await getUserByEmail(email);

          if (!user) {
            console.log(`Login attempt for non-existent user: ${email}`);
            // SECURITY: Return null with GENERIC error (don't reveal if email exists)
            return null;
          }

          // SECURITY: Verify password with bcrypt (constant-time comparison)
          const isPasswordValid = await verifyPassword(password, user.passwordHash);

          if (!isPasswordValid) {
            console.log(`Invalid password attempt for user: ${email}`);
            // SECURITY: Return null with GENERIC error (don't reveal password is wrong)
            return null;
          }

          // SECURITY: Clear rate limit on successful authentication
          clearRateLimit(email);

          console.log(`Successful login for user: ${email}`);

          // SECURITY: Return user object with only necessary fields (no sensitive data)
          return {
            id: user.email, // Use email as ID for JWT
            email: user.email,
            name: user.name,
            studentId: user.studentId,
          };

        } catch (error) {
          // SECURITY: Log error without exposing sensitive details
          console.error('Authentication error:', error instanceof Error ? error.message : 'Unknown error');

          // SECURITY: Always return null on any error (fail-safe)
          return null;
        }
      },
    }),
  ],

  // SECURITY: Configure secure cookies with comprehensive protection
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true, // CRITICAL: Prevents JavaScript access (XSS protection)
        sameSite: 'lax', // CRITICAL: CSRF protection
        path: '/',
        secure: process.env.NODE_ENV === 'production', // CRITICAL: HTTPS only in production
        domain: process.env.NODE_ENV === 'production' ? process.env.NEXTAUTH_URL?.replace(/https?:\/\//, '') : undefined,
      },
    },
  },

  // SECURITY: Configure JWT with proper callbacks
  callbacks: {
    /**
     * SECURITY: JWT callback - Add user data to token
     * Runs whenever a JWT is created, updated, or accessed
     */
    async jwt({ token, user }) {
      // SECURITY: Add user data to token on sign in
      if (user) {
        token.email = user.email;
        token.name = user.name;
        token.studentId = user.studentId;
      }

      return token;
    },

    /**
     * SECURITY: Session callback - Add user data to session
     * Runs whenever a session is checked
     */
    async session({ session, token }) {
      // SECURITY: Add user data from token to session
      if (token) {
        session.user = {
          email: token.email as string,
          name: token.name as string,
          studentId: token.studentId as string,
        };
      }

      return session;
    },

    /**
     * SECURITY: Redirect callback - Control where users go after auth
     */
    async redirect({ url, baseUrl }) {
      // SECURITY: Only allow redirects to same origin
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }

      if (new URL(url).origin === baseUrl) {
        return url;
      }

      // SECURITY: Default redirect to dashboard
      return `${baseUrl}/dashboard`;
    },
  },

  // SECURITY: Custom pages for better UX and security
  pages: {
    signIn: '/login', // Custom login page
    error: '/login', // Redirect errors to login page
  },

  // SECURITY: Configure events for logging and monitoring
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log(`User signed in: ${user.email}`);
    },

    async signOut({ token, session }) {
      console.log(`User signed out: ${token?.email || session?.user?.email}`);
    },

    async createUser({ user }) {
      console.log(`New user created: ${user.email}`);
    },

    async session({ session, token }) {
      // SECURITY: Log session access for monitoring (without sensitive data)
      console.log(`Session accessed: ${session.user?.email}`);
    },
  },

  // SECURITY: Enable debug in development only
  debug: process.env.NODE_ENV === 'development',

  // SECURITY: Secret for JWT signing and encryption
  secret: process.env.NEXTAUTH_SECRET,
};

/**
 * SECURITY: Create NextAuth handler with error handling
 */
const handler = NextAuth(authOptions);

// SECURITY: Export GET and POST handlers for App Router
export { handler as GET, handler as POST };

/**
 * SECURITY: Export authOptions for reuse in other files
 * (e.g., for server-side session validation)
 */
