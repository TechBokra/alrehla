import { canAccessAdmin } from './roles';
import type { UserProfile } from './database.types';

const AUTH_REDIRECT_PATH = '/auth/redirect';

export const normalizeInternalRedirect = (value?: string | null) => {
  if (!value) {
    return null;
  }

  let path = value.trim();

  // Clerk may serialize the return URL as an absolute URL. Accept it only
  // when it points back to this browser origin; never allow an external host.
  if (/^https?:\/\//i.test(path)) {
    if (typeof window === 'undefined') return null;

    try {
      const url = new URL(path);
      if (url.origin !== window.location.origin) return null;
      path = `${url.pathname}${url.search}`;
    } catch {
      return null;
    }
  }

  if (!path.startsWith('/') || path.startsWith('//')) {
    return null;
  }

  if (
    path.startsWith('/login') ||
    path.startsWith('/sso-callback') ||
    path.startsWith(AUTH_REDIRECT_PATH)
  ) {
    return null;
  }

  return path;
};

export const getPostAuthRedirectPath = (
  user: Pick<UserProfile, 'role'>,
  preferredPath?: string | null,
) => {
  if (!canAccessAdmin(user.role)) return null;
  return normalizeInternalRedirect(preferredPath) || '/';
};

export const getOAuthRedirectPath = (preferredPath?: string | null) => {
  const safePath = normalizeInternalRedirect(preferredPath);
  return safePath
    ? AUTH_REDIRECT_PATH + '?next=' + encodeURIComponent(safePath)
    : AUTH_REDIRECT_PATH;
};
