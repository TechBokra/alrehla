'use client';

// Marketplace browser access is intentionally limited to the shared anonymous
// client, Clerk token-provider lifecycle, and safe telemetry user context.
// Server Actions and Server Components must import a server-only service.
export {
  clearSupabaseAccessTokenProvider,
  setSupabaseAccessTokenProvider,
  supabase,
  syncSentryUserContext,
} from '@alrehla/api/lib/supabaseClient';
