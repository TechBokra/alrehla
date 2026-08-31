import 'server-only';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { createServerApiClient, type ApiClient } from '@alrehla/api-client/server';
import {
  ensureClerkProfile,
  getChildProfiles,
  getStudentProfileByProfileId,
} from '@alrehla/api-client/resources/auth';
import type { ChildProfile, UserProfile, UserRole } from '@alrehla/types';
import type { AuthBootstrapState } from '@/lib/auth-state';

const CHILD_OWNING_ROLES = new Set<UserRole>([
  'user',
  'parent',
  'super_admin',
  'general_supervisor',
  'instructor',
  'publisher',
]);

const getErrorCode = (error: unknown): string | undefined => {
  if (!error || typeof error !== 'object') return undefined;

  const candidate = error as {
    code?: unknown;
    cause?: unknown;
  };

  if (typeof candidate.code === 'string') return candidate.code;
  return getErrorCode(candidate.cause);
};

const isSupabaseJwtConfigurationError = (error: unknown): boolean => {
  const code = getErrorCode(error);
  if (code === 'PGRST301') return true;

  if (!error || typeof error !== 'object') return false;
  const message = String((error as { message?: unknown }).message || '').toLowerCase();
  if (message.includes('no suitable key') || message.includes('wrong key type')) {
    return true;
  }

  return isSupabaseJwtConfigurationError((error as { cause?: unknown }).cause);
};

const toSafeProfile = (profile: Record<string, unknown>, clerkUser?: any): UserProfile => {
  const customAvatar =
    typeof profile.avatar_url === 'string' && profile.avatar_url.trim()
      ? profile.avatar_url.trim()
      : undefined;
  const clerkAvatar =
    clerkUser?.imageUrl || clerkUser?.profileImageUrl || undefined;

  return {
    id: String(profile.id || ''),
    email: String(profile.email || ''),
    name: String(profile.name || ''),
    role: profile.role as UserRole,
    avatar_url: customAvatar || clerkAvatar,
    phone: typeof profile.phone === 'string' ? profile.phone : undefined,
    address: typeof profile.address === 'string' ? profile.address : undefined,
    city: typeof profile.city === 'string' ? profile.city : undefined,
    country: typeof profile.country === 'string' ? profile.country : undefined,
    governorate:
      typeof profile.governorate === 'string' ? profile.governorate : undefined,
    timezone: typeof profile.timezone === 'string' ? profile.timezone : undefined,
    currency: typeof profile.currency === 'string' ? profile.currency : undefined,
    created_at: String(profile.created_at || ''),
  };
};

const getClerkProfile = async (
  client: ApiClient,
  clerkUserId: string,
): Promise<UserProfile> => {
  const clerk = await clerkClient();
  const clerkUser = await clerk.users.getUser(clerkUserId);
  const email = (
    clerkUser.primaryEmailAddress?.emailAddress ||
    clerkUser.emailAddresses[0]?.emailAddress ||
    ''
  )
    .trim()
    .toLowerCase();

  if (!email) {
    throw new Error('Clerk user has no usable email address.');
  }

  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ').trim() ||
    clerkUser.username?.trim() ||
    email.split('@')[0] ||
    'مستخدم الرحلة';

  const profile = await ensureClerkProfile(client, {
    email,
    name: name.slice(0, 120),
  });
  return toSafeProfile(profile as unknown as Record<string, unknown>, clerkUser);
};

const getSecondaryUserData = async (
  client: ApiClient,
  user: UserProfile,
): Promise<Pick<AuthBootstrapState, 'currentChildProfile' | 'childProfiles'>> => {
  if (user.role === 'student') {
    const child = await getStudentProfileByProfileId(client, user.id);

    if (!child) {
      return { currentChildProfile: null, childProfiles: [] };
    }

    return {
      currentChildProfile: child,
      childProfiles: [],
    };
  }

  if (!CHILD_OWNING_ROLES.has(user.role)) {
    return { currentChildProfile: null, childProfiles: [] };
  }

  const children = await getChildProfiles(client, user.id);

  return {
    currentChildProfile: null,
    childProfiles: children as ChildProfile[],
  };
};

/**
 * Resolves the authenticated Clerk user and the linked Supabase profile during
 * Server Component rendering. The returned object is safe to pass to a client
 * provider; access tokens never cross that boundary.
 */
export const getServerAuthState = async (): Promise<AuthBootstrapState | null> => {
  const session = await auth();
  if (!session.userId) return null;

  const token = await session.getToken();
  if (!token) return null;

  try {
    const client = createServerApiClient({ accessToken: token });
    const currentUser = await getClerkProfile(client, session.userId);
    const secondary = await getSecondaryUserData(client, currentUser);

    return {
      clerkUserId: session.userId,
      currentUser,
      ...secondary,
    };
  } catch (error) {
    // A missing/mismatched Supabase Third-Party Auth key must not take down
    // public pages. The monitored Supabase transport already records the
    // rejected request; keep the fallback log free of token/Pii details.
    if (isSupabaseJwtConfigurationError(error)) {
      console.error(
        `[marketplace-auth] Supabase rejected the Clerk session token (${getErrorCode(error) || 'JWT_CONFIGURATION_ERROR'}).`,
      );
      return null;
    }

    throw error;
  }
};
