'use client';

import { createBrowserApiClient, type AccessTokenProvider } from '@alrehla/api-client/browser';
import {
  clearSupabaseAccessTokenProvider as clearLegacyProvider,
  setSupabaseAccessTokenProvider as setLegacyProvider,
  supabase,
  syncSentryUserContext,
} from '@alrehla/api/lib/supabaseClient';

let accessTokenProvider: AccessTokenProvider = () => null;

export const apiClient = createBrowserApiClient({
  accessToken: () => accessTokenProvider(),
  allowMissingCredentials: true,
});

export const setSupabaseAccessTokenProvider = (provider: AccessTokenProvider) => {
  accessTokenProvider = provider;
  setLegacyProvider(provider);
};

export const clearSupabaseAccessTokenProvider = () => {
  accessTokenProvider = () => null;
  clearLegacyProvider();
};

export { supabase, syncSentryUserContext };
