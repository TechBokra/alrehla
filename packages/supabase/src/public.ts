import { createClient } from '@supabase/supabase-js';

import type { Database } from '@alrehla/types';

const getPublicConfig = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY before creating a Supabase client.',
    );
  }

  return { url, publishableKey };
};

/** Public browser/client-component access. This client never receives an admin secret. */
export function createPublicSupabaseClient() {
  const { url, publishableKey } = getPublicConfig();

  return createClient<Database>(url, publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
