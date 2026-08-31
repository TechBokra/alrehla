import { createConfiguredSupabaseClient } from './client';
import type { AccessToken, SupabaseClientOptions } from './types';

declare const process: {
  env?: Record<string, string | undefined> & { NODE_ENV?: string };
} | undefined;

export interface PublicClientOptions extends SupabaseClientOptions {
  allowMissingCredentials?: boolean;
}

const getPublicConfig = (allowMissingCredentials: boolean) => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const isTestEnvironment = process.env.NODE_ENV === 'test';

  if ((!url || !publishableKey) && (!allowMissingCredentials || !isTestEnvironment)) {
    throw new Error(
      'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY before creating a Supabase client.',
    );
  }

  return {
    url: url || 'https://placeholder.supabase.co',
    publishableKey: publishableKey || 'placeholder-anon-key',
  };
};

/** Public browser/client-component access. This client never receives an admin secret. */
export function createPublicSupabaseClient(options: PublicClientOptions = {}) {
  const { url, publishableKey } = getPublicConfig(Boolean(options.allowMissingCredentials));

  return createConfiguredSupabaseClient({
    url,
    key: publishableKey,
    accessToken: options.accessToken,
    fetch: options.fetch,
  });
}

export type { AccessToken };
