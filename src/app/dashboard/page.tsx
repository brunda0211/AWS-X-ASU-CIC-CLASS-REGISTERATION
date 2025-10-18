/**
 * Dashboard Page - Server component with authentication check
 * 
 * SECURITY:
 * - Server-side authentication verification
 * - Redirects unauthenticated users to login
 * - Passes session data to client component
 */

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { DashboardClient } from '@/components/DashboardClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Manage your class registrations and view enrolled courses',
};

export default async function DashboardPage() {
  // SECURITY: Server-side authentication check
  const session = await getServerSession(authOptions);
  
  // SECURITY: Redirect unauthenticated users to login
  if (!session?.user) {
    redirect('/login?callbackUrl=/dashboard');
  }

  // Pass session to client component
  return <DashboardClient session={session} />;
}