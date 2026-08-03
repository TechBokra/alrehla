import 'server-only';

import { auth, clerkClient } from '@clerk/nextjs/server';
import type { ChildProfile, UserProfile, UserRole } from '@alrehla/types';
import {
  runWithSupabaseAccessTokenProvider,
  supabase,
} from '@/lib/supabase/server';
import type { AuthBootstrapState } from '@/lib/auth-state';

const CHILD_OWNING_ROLES = new Set<UserRole>([
  'user',
  'parent',
  'super_admin',
  'general_supervisor',
  'instructor',
  'publisher',
]);

const CHILD_PROFILE_COLUMNS =
  'id,user_id,student_user_id,name,birth_date,gender,avatar_url,interests,strengths';

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

const getClerkProfile = async (clerkUserId: string): Promise<UserProfile> => {
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

  const { data, error } = await (supabase.rpc as any)('ensure_clerk_profile', {
    p_email: email,
    p_name: name.slice(0, 120),
  });

  if (error) {
    const profileError = new Error('Unable to resolve the authenticated application profile.');
    (profileError as Error & { cause?: unknown }).cause = error;
    throw profileError;
  }

  const profile = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null;
  if (!profile?.id || typeof profile.role !== 'string') {
    throw new Error('Authenticated application profile is unavailable.');
  }

  return toSafeProfile(profile, clerkUser);
};

const getSecondaryUserData = async (
  user: UserProfile,
): Promise<Pick<AuthBootstrapState, 'currentChildProfile' | 'childProfiles'>> => {
  if (user.role === 'student') {
    const { data: child } = await supabase
      .from('child_profiles')
      .select(CHILD_PROFILE_COLUMNS)
      .eq('student_user_id', user.id)
      .maybeSingle();

    if (!child) {
      return { currentChildProfile: null, childProfiles: [] };
    }

    const childRecord = child as unknown as ChildProfile & { user_id: string };
    const { data: parent } = await supabase
      .from('public_profiles')
      .select('name')
      .eq('id', childRecord.user_id)
      .maybeSingle();

    return {
      currentChildProfile: {
        ...childRecord,
        parentName: (parent as { name?: string } | null)?.name,
      },
      childProfiles: [],
    };
  }

  if (!CHILD_OWNING_ROLES.has(user.role)) {
    return { currentChildProfile: null, childProfiles: [] };
  }

  const { data: children } = await supabase
    .from('child_profiles')
    .select(CHILD_PROFILE_COLUMNS)
    .eq('user_id', user.id)
    .order('id', { ascending: true });

  return {
    currentChildProfile: null,
    childProfiles: (children || []) as ChildProfile[],
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
    return await runWithSupabaseAccessTokenProvider(
      async () => token,
      async () => {
        const currentUser = await getClerkProfile(session.userId);
        const secondary = await getSecondaryUserData(currentUser);

        return {
          clerkUserId: session.userId,
          currentUser,
          ...secondary,
        };
      },
    );
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
