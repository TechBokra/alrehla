const DEFAULT_STUDENT_PANEL_URL = 'http://localhost:3002';

const normalizeBaseUrl = (url: string) => url.replace(/\/$/, '');
const normalizePath = (path: string) => (path.startsWith('/') ? path : `/${path}`);

export const getStudentPanelUrl = (path = '/') => {
  const baseUrl = normalizeBaseUrl(
    process.env.NEXT_PUBLIC_STUDENT_PANEL_URL || DEFAULT_STUDENT_PANEL_URL,
  );

  return `${baseUrl}${normalizePath(path)}`;
};

export const redirectToStudentPanel = (path = '/') => {
  if (typeof window === 'undefined') return;
  window.location.assign(getStudentPanelUrl(path));
};
