import { canAccessAdmin } from './roles';
import type { UserProfile } from './database.types';

const AUTH_REDIRECT_PATH = '/auth/redirect';

export const normalizeInternalRedirect = (value?: string | null) => {
  if (!value || !value.startsWith('/') || value.startsWith('//') || /^https?:\/\//i.test(value)) {
    return null;
  }

  if (
    value.startsWith('/login') ||
    value.startsWith('/sso-callback') ||
    value.startsWith(AUTH_REDIRECT_PATH)
  ) {
    return null;
  }

  return value;
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
