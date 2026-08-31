import { createClient } from '@supabase/supabase-js';
import type { Database } from '@alrehla/types';

export const TEST_SUPABASE_URL = 'https://test-project.supabase.co';
export const TEST_SUPABASE_KEY = 'test-publishable-key';

export const jsonResponse = (
  data: unknown,
  headers: Record<string, string> = {},
): Response => new Response(JSON.stringify(data), {
  status: 200,
  headers: { 'content-type': 'application/json', ...headers },
});

export const createTestClient = (
  handler: (request: Request) => Response | Promise<Response>,
) => {
  const requests: Request[] = [];
  const fetch: typeof globalThis.fetch = async (input, init) => {
    const request = new Request(input, init);
    requests.push(request);
    return handler(request);
  };

  const client = createClient<Database>(TEST_SUPABASE_URL, TEST_SUPABASE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: { fetch },
  });

  return { client, fetch, requests };
};

export const requestBody = async (request: Request): Promise<Record<string, unknown>> => {
  const body = await request.json();
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new Error('Expected a JSON object request body.');
  }
  return body as Record<string, unknown>;
};
