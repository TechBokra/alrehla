import { createClient } from '@supabase/supabase-js';

import type { Database } from '@alrehla/types';
import { toAccessTokenProvider, type SupabaseClientOptions } from './types';

interface CreateSupabaseClientOptions extends SupabaseClientOptions {
  url: string;
  key: string;
}

export const createConfiguredSupabaseClient = ({
  url,
  key,
  accessToken,
  fetch,
}: CreateSupabaseClientOptions) => {
  const accessTokenProvider = toAccessTokenProvider(accessToken);
  return createClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    ...(accessTokenProvider
      ? { accessToken: accessTokenProvider }
      : {}),
    ...(fetch ? { global: { fetch } } : {}),
  });
};
