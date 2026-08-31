export type AccessTokenProvider = () => Promise<string | null> | string | null;

export type AccessToken = string | null | AccessTokenProvider;

export interface SupabaseClientOptions {
  accessToken?: AccessToken;
  fetch?: typeof globalThis.fetch;
}

export const toAccessTokenProvider = (
  accessToken: AccessToken | undefined,
): (() => Promise<string | null>) | undefined => {
  if (accessToken === undefined) return undefined;
  return async () => {
    const value = typeof accessToken === 'function' ? accessToken() : accessToken;
    return await value;
  };
};
