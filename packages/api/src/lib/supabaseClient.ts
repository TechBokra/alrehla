import { createClient } from "@supabase/supabase-js";
import type { Database } from "@alrehla/types";

declare const process: { env?: Record<string, string | undefined> } | undefined;

type SupabaseAccessTokenProvider = () => Promise<string | null> | string | null;

let externalAccessTokenProvider: SupabaseAccessTokenProvider | null = null;
let serverAccessTokenStoragePromise: Promise<{
  run<T>(provider: SupabaseAccessTokenProvider, callback: () => T): T;
  getStore(): SupabaseAccessTokenProvider | undefined;
} | null> | null = null;

const SUPABASE_URL =
  (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_URL : undefined) ||
  ((import.meta as any).env?.VITE_SUPABASE_URL) ||
  "";
const SUPABASE_PUBLISHABLE_KEY =
  (typeof process !== 'undefined' ? (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) : undefined) ||
  ((import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY) ||
  ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY) ||
  "";

const hasConfiguredSupabaseCredentials = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
const EFFECTIVE_SUPABASE_URL = SUPABASE_URL || "https://placeholder.supabase.co";
const EFFECTIVE_SUPABASE_PUBLISHABLE_KEY = SUPABASE_PUBLISHABLE_KEY || "placeholder-anon-key";

if (!hasConfiguredSupabaseCredentials) {
  console.warn(
    "Supabase credentials are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or Vite equivalents).",
  );
}

export const setSupabaseAccessTokenProvider = (provider: SupabaseAccessTokenProvider) => {
  externalAccessTokenProvider = provider;
};

export const clearSupabaseAccessTokenProvider = () => {
  externalAccessTokenProvider = null;
};

const getServerAccessTokenStorage = async () => {
  if (typeof window !== 'undefined') return null;

  serverAccessTokenStoragePromise ||= (async () => {
    try {
      const { AsyncLocalStorage } = await (0, eval)("import('node:async_hooks')");
      const Storage = AsyncLocalStorage as new () => {
        run<T>(provider: SupabaseAccessTokenProvider, callback: () => T): T;
        getStore(): SupabaseAccessTokenProvider | undefined;
      };
      return new Storage();
    } catch {
      return null;
    }
  })();

  return serverAccessTokenStoragePromise;
};

export const runWithSupabaseAccessTokenProvider = async <T>(
  provider: SupabaseAccessTokenProvider,
  callback: () => Promise<T>,
): Promise<T> => {
  const storage = await getServerAccessTokenStorage();
  if (storage) {
    return storage.run(provider, callback);
  }

  const previousProvider = externalAccessTokenProvider;
  externalAccessTokenProvider = provider;
  try {
    return await callback();
  } finally {
    externalAccessTokenProvider = previousProvider;
  }
};

const getRequestAccessToken = async () => {
  const storage = await getServerAccessTokenStorage();
  const scopedProvider = storage?.getStore();
  if (scopedProvider) {
    const token = await scopedProvider();
    return token || null;
  }

  if (externalAccessTokenProvider) {
    const token = await externalAccessTokenProvider();
    return token || null;
  }

  if (typeof window === 'undefined') {
    try {
      const { auth } = await (0, eval)("import('@clerk/nextjs/server')");
      const session = await auth();
      if (session && typeof session.getToken === 'function') {
        const token = await session.getToken();
        if (token) return token;
      }
    } catch {
      // Outside a Next.js request, authenticated Supabase calls must use runWithSupabaseAccessTokenProvider.
    }
  }

  return null;
};

export const supabase = createClient<Database>(
  EFFECTIVE_SUPABASE_URL,
  EFFECTIVE_SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    accessToken: getRequestAccessToken,
  },
);

export const getCurrentAppProfileId = async (): Promise<string | null> => {
  try {
    const { data, error } = await (supabase.rpc as any)('current_app_profile_id');
    if (!error && data) return data as string;
  } catch {
    // This helper exists after running the Clerk auth SQL migration.
  }

  return null;
};

export const hasSupabaseCredentials = () => {
  return hasConfiguredSupabaseCredentials;
};
