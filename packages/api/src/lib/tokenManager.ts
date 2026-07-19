/**
 * Deprecated compatibility shim.
 * Clerk owns browser sessions now; do not store bearer tokens in localStorage.
 */
export const getToken = (): null => null;

export const setToken = (_newToken: string): void => {};

export const clearToken = (): void => {};
