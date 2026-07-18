const DEFAULT_MARKETPLACE_URL = 'http://localhost:3000';

const normalizeBaseUrl = (url: string) => url.replace(/\/$/, '');
const normalizePath = (path: string) => (path.startsWith('/') ? path : `/${path}`);

export const getMarketplaceUrl = (path = '/') => {
  const baseUrl = normalizeBaseUrl(
    process.env.NEXT_PUBLIC_MARKETPLACE_URL || DEFAULT_MARKETPLACE_URL,
  );

  return `${baseUrl}${normalizePath(path)}`;
};

export const redirectToMarketplace = (path = '/') => {
  if (typeof window === 'undefined') return;
  window.location.assign(getMarketplaceUrl(path));
};
