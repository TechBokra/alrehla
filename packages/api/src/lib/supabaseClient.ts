import { createClient } from "@supabase/supabase-js";
import type { Database } from "@alrehla/types";
import {
  captureSupabaseError,
  shouldIgnoreError,
  startSpan,
  setUser,
  clearUser,
  type SentryUserContext,
} from "@alrehla/utils";

declare const process: { env?: Record<string, string | undefined> } | undefined;

type SupabaseAccessTokenProvider = () => Promise<string | null> | string | null;
type SupabaseOperationDetails = {
  operation: string;
  table?: string;
  rpcName?: string;
  bucket?: string;
};

let externalAccessTokenProvider: SupabaseAccessTokenProvider | null = null;
let serverAccessTokenStoragePromise: Promise<{
  run<T>(provider: SupabaseAccessTokenProvider, callback: () => T): T;
  getStore(): SupabaseAccessTokenProvider | undefined;
} | null> | null = null;

const SUPABASE_URL =
  (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_URL : undefined) ||
  "";
const SUPABASE_PUBLISHABLE_KEY =
  (typeof process !== 'undefined'
    ? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    : undefined) ||
  "";

const hasConfiguredSupabaseCredentials = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
const EFFECTIVE_SUPABASE_URL = SUPABASE_URL || "https://placeholder.supabase.co";
const EFFECTIVE_SUPABASE_PUBLISHABLE_KEY = SUPABASE_PUBLISHABLE_KEY || "placeholder-anon-key";

if (!hasConfiguredSupabaseCredentials) {
  console.warn(
    "Supabase credentials are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
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

const getSupabaseOperationDetails = (
  input: RequestInfo | URL,
  init?: RequestInit,
): SupabaseOperationDetails => {
  const rawUrl =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url;
  const method = (
    init?.method ||
    (typeof Request !== 'undefined' && input instanceof Request ? input.method : 'GET')
  ).toUpperCase();
  const pathname = new URL(rawUrl, EFFECTIVE_SUPABASE_URL).pathname;

  const rpcMatch = pathname.match(/\/rest\/v1\/rpc\/([^/]+)/);
  if (rpcMatch) {
    return { operation: 'RPC', rpcName: decodeURIComponent(rpcMatch[1]) };
  }

  const tableMatch = pathname.match(/\/rest\/v1\/([^/]+)/);
  if (tableMatch) {
    const operationByMethod: Record<string, string> = {
      GET: 'SELECT',
      HEAD: 'SELECT',
      POST: 'INSERT',
      PATCH: 'UPDATE',
      PUT: 'UPDATE',
      DELETE: 'DELETE',
    };
    return {
      operation: operationByMethod[method] || method,
      table: decodeURIComponent(tableMatch[1]),
    };
  }

  const storageMatch = pathname.match(
    /\/storage\/v1\/object\/(?:(?:sign|public|authenticated)\/)?([^/]+)/,
  );
  if (storageMatch) {
    return {
      operation:
        method === 'DELETE'
          ? 'STORAGE_DELETE'
          : method === 'POST' || method === 'PUT'
            ? 'STORAGE_UPLOAD'
            : 'STORAGE_DOWNLOAD',
      bucket: decodeURIComponent(storageMatch[1]),
    };
  }

  if (pathname.includes('/functions/v1/')) {
    return { operation: 'EDGE_FUNCTION' };
  }

  if (pathname.includes('/auth/v1/')) {
    return { operation: 'AUTH' };
  }

  return { operation: `HTTP_${method}` };
};

/**
 * Supabase-js returns most backend failures as `{ error }` values instead of throwing.
 * Instrumenting its transport guarantees database, RPC, Storage, Auth, and Function
 * failures are observed even when a caller handles or transforms the returned error.
 */
const monitoredSupabaseFetch = async (
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> => {
  const details = getSupabaseOperationDetails(input, init);
  const startedAt = Date.now();

  return startSpan(
    {
      name: details.rpcName
        ? `Supabase RPC ${details.rpcName}`
        : details.table
          ? `Supabase ${details.operation} ${details.table}`
          : details.bucket
            ? `Supabase ${details.operation} ${details.bucket}`
            : `Supabase ${details.operation}`,
      op: details.operation === 'RPC' ? 'rpc' : 'db.query',
      attributes: {
        'db.system': 'postgresql',
        'db.operation': details.operation,
        'db.sql.table': details.table,
        'rpc.service': details.rpcName,
        'storage.bucket': details.bucket,
      },
    },
    async (span) => {
      try {
        const response = await globalThis.fetch(input, init);
        span?.setAttribute('http.response.status_code', response.status);

        if (!response.ok) {
          span?.setStatus({ code: 2, message: `http_${response.status}` });
          captureSupabaseError(
            new Error(`Supabase ${details.operation} request failed with status ${response.status}`),
            {
              ...details,
              statusCode: response.status,
              durationMs: Date.now() - startedAt,
            },
          );
        }

        return response;
      } catch (error) {
        span?.setStatus({ code: 2, message: 'network_error' });
        if (!shouldIgnoreError(error)) {
          captureSupabaseError(error, {
            ...details,
            durationMs: Date.now() - startedAt,
          });
        }
        throw error;
      }
    },
  );
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
    global: {
      fetch: monitoredSupabaseFetch,
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

/**
 * Wraps a Supabase Database Query in a Sentry performance span and captures any failures.
 */
export const wrapSupabaseQuery = async <T>(
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | string,
  table: string,
  queryFn: () => Promise<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: any }> => {
  const startTime = Date.now();
  return startSpan(
    {
      name: `Supabase ${operation} ${table}`,
      op: 'db.query',
      attributes: {
        'db.system': 'postgresql',
        'db.sql.table': table,
        'db.operation': operation,
      },
    },
    async (span) => {
      const result = await queryFn();
      const durationMs = Date.now() - startTime;

      if (result.error) {
        if (span && typeof span.setStatus === 'function') {
          span.setStatus({ code: 2, message: result.error.message || 'query_error' });
        }
        if (!shouldIgnoreError(result.error)) {
          captureSupabaseError(result.error, {
            operation,
            table,
            statusCode: result.error.code || result.error.status,
            durationMs,
            metadata: { details: result.error.details, hint: result.error.hint },
          });
        }
      }

      return result;
    }
  );
};

/**
 * Wraps a Supabase RPC invocation in a Sentry performance span and captures any failures.
 */
export const wrapSupabaseRpc = async <T>(
  rpcName: string,
  rpcFn: () => Promise<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: any }> => {
  const startTime = Date.now();
  return startSpan(
    {
      name: `Supabase RPC ${rpcName}`,
      op: 'rpc',
      attributes: {
        'rpc.system': 'supabase',
        'rpc.service': rpcName,
      },
    },
    async (span) => {
      const result = await rpcFn();
      const durationMs = Date.now() - startTime;

      if (result.error) {
        if (span && typeof span.setStatus === 'function') {
          span.setStatus({ code: 2, message: result.error.message || 'rpc_error' });
        }
        if (!shouldIgnoreError(result.error)) {
          captureSupabaseError(result.error, {
            operation: 'RPC',
            rpcName,
            statusCode: result.error.code || result.error.status,
            durationMs,
            metadata: { details: result.error.details, hint: result.error.hint },
          });
        }
      }

      return result;
    }
  );
};

/**
 * Wraps a Supabase Storage operation in a Sentry performance span and captures any failures.
 */
export const wrapSupabaseStorage = async <T>(
  operation: 'STORAGE_UPLOAD' | 'STORAGE_DOWNLOAD' | 'STORAGE_DELETE' | string,
  bucket: string,
  storageFn: () => Promise<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: any }> => {
  const startTime = Date.now();
  return startSpan(
    {
      name: `Supabase Storage ${operation} (${bucket})`,
      op: 'storage',
      attributes: {
        'storage.bucket': bucket,
        'storage.operation': operation,
      },
    },
    async (span) => {
      const result = await storageFn();
      const durationMs = Date.now() - startTime;

      if (result.error) {
        if (span && typeof span.setStatus === 'function') {
          span.setStatus({ code: 2, message: result.error.message || 'storage_error' });
        }
        if (!shouldIgnoreError(result.error)) {
          captureSupabaseError(result.error, {
            operation,
            bucket,
            statusCode: result.error.statusCode || result.error.status,
            durationMs,
            metadata: { message: result.error.message },
          });
        }
      }

      return result;
    }
  );
};

/**
 * Wraps a client-side Supabase Edge Function invocation in a Sentry span and captures any failures.
 */
export const wrapSupabaseEdgeFunction = async <T>(
  functionName: string,
  invokeFn: () => Promise<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: any }> => {
  const startTime = Date.now();
  return startSpan(
    {
      name: `Supabase Function ${functionName}`,
      op: 'http.client.function',
      attributes: {
        'faas.invoked_name': functionName,
        'faas.invoked_provider': 'supabase',
      },
    },
    async (span) => {
      const result = await invokeFn();
      const durationMs = Date.now() - startTime;

      if (result.error) {
        if (span && typeof span.setStatus === 'function') {
          span.setStatus({ code: 2, message: result.error.message || 'function_error' });
        }
        if (!shouldIgnoreError(result.error)) {
          captureSupabaseError(result.error, {
            operation: 'EDGE_FUNCTION',
            metadata: { functionName, error: result.error },
            durationMs,
          });
        }
      }

      return result;
    }
  );
};

/**
 * Safely synchronizes authenticated user context with Sentry.
 * Enforces privacy by attaching ONLY id, email, and role.
 * Guaranteed never to send JWT, cookies, refresh token, access token, or password.
 */
export const syncSentryUserContext = (user: SentryUserContext | null): void => {
  if (!user) {
    clearUser();
    return;
  }
  setUser({
    id: user.id,
    email: user.email,
    role: user.role,
  });
};
