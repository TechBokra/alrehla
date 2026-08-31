import { createPublicSupabaseClient } from '@alrehla/supabase/public';

import type { ApiClient, ClientOptions } from './types';

export type { AccessToken, AccessTokenProvider, ApiClient, ClientOptions } from './types';

export const createBrowserApiClient = (options: ClientOptions = {}): ApiClient =>
  createPublicSupabaseClient({
    accessToken: options.accessToken,
    fetch: options.fetch,
    allowMissingCredentials: options.allowMissingCredentials,
  });
