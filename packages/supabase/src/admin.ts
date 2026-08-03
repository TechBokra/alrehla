import 'server-only';

import { createClient } from '@supabase/supabase-js';

import type { Database } from '@alrehla/types';

/**
 * Secret-key client for verified webhooks and narrowly scoped trusted jobs.
 * Never import this module from a Client Component or ordinary user workflow.
 */
export function createAdminSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error(
      'SUPABASE_SECRET_KEY and NEXT_PUBLIC_SUPABASE_URL are required for the admin Supabase client.',
    );
  }

  return createClient<Database>(url, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
