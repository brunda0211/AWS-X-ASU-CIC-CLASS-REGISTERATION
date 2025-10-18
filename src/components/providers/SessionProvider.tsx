'use client';

/**
 * SessionProvider - NextAuth.js session provider wrapper
 * 
 * Provides session context to all components in the application
 * Must be a client component to use NextAuth.js hooks
 */

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';

interface SessionProviderProps {
  children: React.ReactNode;
  session?: Session | null;
}

export function SessionProvider({ children, session }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider session={session}>
      {children}
    </NextAuthSessionProvider>
  );
}