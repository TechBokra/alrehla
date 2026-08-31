import { createServerSupabaseClient } from '@alrehla/supabase/server';

import type { AccessToken, ApiClient } from './types';

export type { AccessToken, AccessTokenProvider, ApiClient } from './types';

export interface ServerApiClientOptions {
  accessToken: AccessToken;
  fetch?: typeof globalThis.fetch;
}

export const createServerApiClient = ({
  accessToken,
  fetch,
}: ServerApiClientOptions): ApiClient =>
  createServerSupabaseClient({ accessToken, fetch }) as unknown as ApiClient;
