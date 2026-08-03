import type { Metadata } from 'next';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { syncCurrentClerkProfile } from '@/actions/userActions';
import { getPostAuthRedirectPath } from '@/lib/dashboardRedirect';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

type AuthRedirectPageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function AuthRedirectPage({
  searchParams,
}: AuthRedirectPageProps) {
  const { userId } = await auth();
  if (!userId) {
    redirect('/login');
  }

  const params = await searchParams;
  const requestedPath =
    typeof params.next === 'string' ? params.next : undefined;
  const currentUser = await syncCurrentClerkProfile();
  redirect(getPostAuthRedirectPath(currentUser, requestedPath));
}
