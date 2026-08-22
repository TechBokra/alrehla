declare const process: { env?: Record<string, string | undefined> } | undefined;

const DEFAULT_INSTRUCTOR_PANEL_URL = 'http://localhost:3003';

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const env = typeof process === 'undefined' ? {} : (process.env ?? {});

export const getInstructorPanelUrl = (path = ''): string => {
  const base = trimTrailingSlash(
    env.NEXT_PUBLIC_INSTRUCTOR_PANEL_URL ||
      DEFAULT_INSTRUCTOR_PANEL_URL,
  );
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath === '/' ? '' : normalizedPath}`;
};

export const redirectToInstructorPanel = (path = '/') => {
  window.location.assign(getInstructorPanelUrl(path));
};
