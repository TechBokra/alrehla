import 'server-only';

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

/**
 * Protect a Server Component resource with Clerk's request-scoped identity.
 * Data-layer authorization remains enforced independently by Server Actions
 * and Supabase RLS.
 */
export const requireMarketplaceAuth = async (redirectPath: string): Promise<string> => {
  const { userId } = await auth();
  if (!userId) {
    redirect(`/login?redirect_url=${encodeURIComponent(redirectPath)}`);
  }

  return userId;
};
