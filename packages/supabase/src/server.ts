import 'server-only';

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

import type { Database } from '@alrehla/types';

/**
 * Creates an RLS-aware Supabase client using the normal Clerk session token.
 * Supabase Third-Party Auth validates that token; no custom JWT template is used.
 */
export function createAuthenticatedSupabaseClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      accessToken: async () => {
        const { getToken } = await auth();
        return getToken();
      },
    },
  );
}
