import type { UserProfile, UserRole } from './database.types';
import { canAccessAdmin } from './roles';
import { getAdminPanelUrl } from './adminPanelUrl';
import { getStudentPanelUrl } from './studentPanelUrl';

const AUTH_REDIRECT_PATH = '/auth/redirect';
const ACCOUNT_DASHBOARD_PATH = '/account';

export interface DashboardDestination {
  href: string;
  external: boolean;
  label: string;
  panel: 'admin' | 'student' | 'marketplace';
}

export const isExternalUrl = (value: string) => /^https?:\/\//i.test(value);

export const normalizeInternalRedirect = (value?: string | null) => {
  if (!value || !value.startsWith('/') || value.startsWith('//') || isExternalUrl(value)) {
    return null;
  }

  if (
    value.startsWith('/login') ||
    value.startsWith('/signup') ||
    value.startsWith('/sso-callback') ||
    value.startsWith(AUTH_REDIRECT_PATH)
  ) {
    return null;
  }

  return value;
};

export const getDashboardDestinationForRole = (
  role?: UserRole | null,
): DashboardDestination => {
  if (role === 'student') {
    return {
      href: getStudentPanelUrl('/dashboard'),
      external: true,
      label: 'لوحة الطالب',
      panel: 'student',
    };
  }

  if (canAccessAdmin(role)) {
    return {
      href: getAdminPanelUrl('/'),
      external: true,
      label: 'لوحة التحكم',
      panel: 'admin',
    };
  }

  return {
    href: ACCOUNT_DASHBOARD_PATH,
    external: false,
    label: 'لوحة الحساب',
    panel: 'marketplace',
  };
};

export const getPostAuthRedirectPath = (
  user: Pick<UserProfile, 'role'>,
  preferredPath?: string | null,
) => {
  const destination = getDashboardDestinationForRole(user.role);

  if (destination.external) {
    return destination.href;
  }

  return normalizeInternalRedirect(preferredPath) || destination.href;
};

export const getOAuthRedirectPath = (preferredPath?: string | null) => {
  const safePath = normalizeInternalRedirect(preferredPath);
  return safePath
    ? `${AUTH_REDIRECT_PATH}?next=${encodeURIComponent(safePath)}`
    : AUTH_REDIRECT_PATH;
};
