import type { SupabaseClient } from '@supabase/supabase-js';

import type { AccessToken, AccessTokenProvider } from '@alrehla/supabase/types';

// Resource functions provide the public type contract. The repository's
// hand-maintained Database type is intentionally not treated as a generated
// PostgREST schema because domain models and infrastructure records differ.
export type ApiClient = SupabaseClient<any>;
export type { AccessToken, AccessTokenProvider };

export interface ClientOptions {
  accessToken?: AccessToken;
  fetch?: typeof globalThis.fetch;
  allowMissingCredentials?: boolean;
}

export interface RequestOptions {
  signal?: AbortSignal;
}
