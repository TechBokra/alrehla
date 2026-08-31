import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createBrowserApiClient } from '../src/clients/browser';
import { createServerApiClient } from '../src/clients/server';
import {
  TEST_SUPABASE_KEY,
  TEST_SUPABASE_URL,
  jsonResponse,
} from './helpers';

const setTestCredentials = () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = TEST_SUPABASE_URL;
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = TEST_SUPABASE_KEY;
};

const makeFetch = (requests: Request[]) => {
  const fetch: typeof globalThis.fetch = async (input, init) => {
    const request = new Request(input, init);
    requests.push(request);
    return jsonResponse([]);
  };
  return fetch;
};

describe('API client authentication and transport injection', () => {
  beforeEach(setTestCredentials);

  it('injects a string token into the browser client', async () => {
    const requests: Request[] = [];
    const client = createBrowserApiClient({
      accessToken: 'browser-token',
      fetch: makeFetch(requests),
    });

    await client.from('bookings').select('id').limit(1);

    expect(requests).toHaveLength(1);
    expect(requests[0].headers.get('authorization')).toBe('Bearer browser-token');
  });

  it('supports a synchronous and asynchronous access-token provider', async () => {
    const syncRequests: Request[] = [];
    const syncProvider = vi.fn(() => 'sync-token');
    const syncClient = createBrowserApiClient({
      accessToken: syncProvider,
      fetch: makeFetch(syncRequests),
    });
    await syncClient.from('bookings').select('id').limit(1);

    const asyncRequests: Request[] = [];
    const asyncProvider = vi.fn(async () => 'async-token');
    const asyncClient = createServerApiClient({
      accessToken: asyncProvider,
      fetch: makeFetch(asyncRequests),
    });
    await asyncClient.from('bookings').select('id').limit(1);

    expect(syncProvider).toHaveBeenCalled();
    expect(syncRequests[0].headers.get('authorization')).toBe('Bearer sync-token');
    expect(asyncProvider).toHaveBeenCalled();
    expect(asyncRequests[0].headers.get('authorization')).toBe('Bearer async-token');
  });

  it('injects a string token into the server client', async () => {
    const requests: Request[] = [];
    const client = createServerApiClient({
      accessToken: 'server-token',
      fetch: makeFetch(requests),
    });

    await client.from('bookings').select('id').limit(1);

    expect(requests[0].headers.get('authorization')).toBe('Bearer server-token');
  });

  it('treats null as an explicit unauthenticated request', async () => {
    const requests: Request[] = [];
    const staleProvider = vi.fn(async () => 'stale-token');
    const client = createServerApiClient({
      accessToken: null,
      fetch: makeFetch(requests),
    });

    await client.from('bookings').select('id').limit(1);

    expect(staleProvider).not.toHaveBeenCalled();
    expect(requests[0].headers.get('authorization')).not.toBe('Bearer stale-token');
    expect(requests[0].headers.get('authorization')).toBe(`Bearer ${TEST_SUPABASE_KEY}`);
  });

  it('uses the injected fetch implementation for both client factories', async () => {
    const browserRequests: Request[] = [];
    const browserFetch = makeFetch(browserRequests);
    const browserClient = createBrowserApiClient({ accessToken: null, fetch: browserFetch });
    await browserClient.from('bookings').select('id').limit(1);

    const serverRequests: Request[] = [];
    const serverFetch = makeFetch(serverRequests);
    const serverClient = createServerApiClient({ accessToken: null, fetch: serverFetch });
    await serverClient.from('bookings').select('id').limit(1);

    expect(browserRequests).toHaveLength(1);
    expect(serverRequests).toHaveLength(1);
  });

  it('does not permit placeholder credentials outside test tooling', () => {
    const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const previousKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const previousNodeEnv = process.env.NODE_ENV;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    process.env.NODE_ENV = 'production';

    try {
      expect(() => createBrowserApiClient({
        accessToken: null,
        allowMissingCredentials: true,
      })).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
    } finally {
      process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = previousKey;
      process.env.NODE_ENV = previousNodeEnv;
    }
  });
});
