import { createConfiguredSupabaseClient } from './client';
import type { AccessToken, SupabaseClientOptions } from './types';

declare const process: { env: Record<string, string | undefined> };

/**
 * Creates an RLS-aware Supabase client using an injected request token.
 * Authentication belongs to the application layer; this package only configures
 * Supabase Third-Party Auth with the supplied token.
 */
export function createAuthenticatedSupabaseClient(options: SupabaseClientOptions) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are required for the authenticated Supabase client.',
    );
  }

  return createConfiguredSupabaseClient({
    url,
    key: publishableKey,
    accessToken: options.accessToken,
    fetch: options.fetch,
  });
}

export const createServerSupabaseClient = createAuthenticatedSupabaseClient;

export type { AccessToken };
