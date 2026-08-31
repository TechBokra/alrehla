import type { SupabaseClient } from '@supabase/supabase-js';

import type { AccessToken, AccessTokenProvider } from '@alrehla/supabase/types';
import type { Database } from '@alrehla/types';

export type ApiClient = SupabaseClient<Database>;
export type { AccessToken, AccessTokenProvider };

export interface ClientOptions {
  accessToken?: AccessToken;
  fetch?: typeof globalThis.fetch;
  allowMissingCredentials?: boolean;
}

export interface RequestOptions {
  signal?: AbortSignal;
}
