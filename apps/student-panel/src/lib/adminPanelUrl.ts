declare const process: { env?: Record<string, string | undefined> } | undefined;

const DEFAULT_ADMIN_PANEL_URL = 'http://localhost:3001';

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const env = typeof process === 'undefined' ? {} : (process.env ?? {});

export const getAdminPanelUrl = (path = ''): string => {
  const base = trimTrailingSlash(
    env.NEXT_PUBLIC_ADMIN_PANEL_URL ||
      DEFAULT_ADMIN_PANEL_URL,
  );
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath === '/' ? '' : normalizedPath}`;
};

export const redirectToAdminPanel = (path = '/') => {
  window.location.assign(getAdminPanelUrl(path));
};
