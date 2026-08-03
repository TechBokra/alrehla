import 'server-only';

import { auth } from '@clerk/nextjs/server';
import {
  runWithSupabaseAccessTokenProvider,
  supabase,
} from '@/lib/supabase/server';
import type { UserRole } from '@alrehla/types';
import { revalidateTag } from 'next/cache';
import type { z } from 'zod';

const DATABASE_ADMIN_ROLES = ['super_admin', 'general_supervisor'] as const satisfies readonly UserRole[];

const USER_ROLES = new Set<UserRole>([
  'user',
  'parent',
  'student',
  'instructor',
  'super_admin',
  'general_supervisor',
  'enha_lak_supervisor',
  'creative_writing_supervisor',
  'content_editor',
  'support_agent',
  'publisher',
]);

const GENERIC_ACTION_ERROR = 'تعذر تنفيذ الطلب بأمان. حاول مرة أخرى.';
const AUTHENTICATION_ERROR = 'يجب تسجيل الدخول لتنفيذ هذا الطلب.';
const AUTHORIZATION_ERROR = 'لا تملك صلاحية تنفيذ هذا الطلب.';

export const MARKETPLACE_ROLES = {
  databaseAdmins: DATABASE_ADMIN_ROLES,
  orderManagers: DATABASE_ADMIN_ROLES,
  bookingManagers: DATABASE_ADMIN_ROLES,
  supportManagers: ['super_admin', 'general_supervisor', 'support_agent'] as const satisfies readonly UserRole[],
  productManagers: ['super_admin', 'general_supervisor', 'enha_lak_supervisor'] as const satisfies readonly UserRole[],
  productAuthors: ['super_admin', 'general_supervisor', 'enha_lak_supervisor', 'publisher'] as const satisfies readonly UserRole[],
} as const;

export type MarketplaceActor = {
  id: string;
  clerkUserId: string;
  email: string;
  role: UserRole;
};

export type ClerkActionContext = {
  clerkUserId: string;
  supabase: typeof supabase;
};

export type MarketplaceActionContext = ClerkActionContext & {
  actor: MarketplaceActor;
};

export class MarketplaceActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MarketplaceActionError';
  }
}

const getErrorCode = (error: unknown) => {
  if (!error || typeof error !== 'object' || !('code' in error)) return undefined;
  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' || typeof code === 'number' ? code : undefined;
};

const throwSafeActionError = (actionName: string, error: unknown): never => {
  console.error(`[marketplace-action:${actionName}] failed:`, error);

  if (error instanceof MarketplaceActionError) {
    throw new Error(error.message);
  }

  if (error instanceof Error && error.message) {
    throw new Error(error.message);
  }

  throw new Error(GENERIC_ACTION_ERROR);
};

export const actionError = (message: string): never => {
  throw new MarketplaceActionError(message);
};

export const parseActionInput = <Schema extends z.ZodTypeAny>(
  schema: Schema,
  input: unknown,
): z.infer<Schema> => {
  const result = schema.safeParse(input);
  if (!result.success) {
    actionError('البيانات المدخلة غير صالحة.');
  }
  return result.data;
};

export const hasAnyRole = (
  actor: MarketplaceActor,
  roles: readonly UserRole[],
): boolean => roles.includes(actor.role);

export const isDatabaseAdmin = (actor: MarketplaceActor): boolean =>
  hasAnyRole(actor, DATABASE_ADMIN_ROLES);

export const revalidateMarketplaceTags = (...tags: Array<string | null | undefined>) => {
  for (const tag of new Set(tags.filter((tag): tag is string => Boolean(tag)))) {
    revalidateTag(tag, 'max');
  }
};

export const withClerkSessionAction = async <T>(
  actionName: string,
  operation: (context: ClerkActionContext) => Promise<T>,
): Promise<T> => {
  try {
    const session = await auth();
    if (!session.userId) {
      actionError(AUTHENTICATION_ERROR);
    }

    const token = await session.getToken();
    if (!token) {
      actionError('تعذر التحقق من جلسة تسجيل الدخول. أعد تسجيل الدخول وحاول مرة أخرى.');
    }

    return await runWithSupabaseAccessTokenProvider(
      async () => token,
      () =>
        operation({
          clerkUserId: session.userId,
          supabase,
        }),
    );
  } catch (error) {
    return throwSafeActionError(actionName, error);
  }
};

export const withMarketplaceAction = async <T>(
  actionName: string,
  operation: (context: MarketplaceActionContext) => Promise<T>,
  allowedRoles?: readonly UserRole[],
): Promise<T> =>
  withClerkSessionAction(actionName, async (context) => {
    const { data: profileId, error: profileIdError } = await (context.supabase.rpc as any)(
      'current_app_profile_id',
    );

    if (profileIdError || typeof profileId !== 'string' || !profileId) {
      actionError('تعذر التحقق من ملف المستخدم المرتبط بجلسة Clerk.');
    }

    const { data, error } = await context.supabase
      .from('profiles')
      .select('id, clerk_user_id, email, role')
      .eq('id', profileId)
      .maybeSingle();

    const profile = data as {
      id?: string;
      clerk_user_id?: string | null;
      email?: string;
      role?: string;
    } | null;

    if (
      error ||
      !profile?.id ||
      profile.clerk_user_id !== context.clerkUserId ||
      !profile.role ||
      !USER_ROLES.has(profile.role as UserRole)
    ) {
      actionError('تعذر التحقق من هوية المستخدم وصلاحياته.');
    }

    const actor: MarketplaceActor = {
      id: profile.id,
      clerkUserId: context.clerkUserId,
      email: profile.email || '',
      role: profile.role as UserRole,
    };

    if (allowedRoles && !hasAnyRole(actor, allowedRoles)) {
      actionError(AUTHORIZATION_ERROR);
    }

    return operation({ ...context, actor });
  });

export const withPublicAction = async <T>(
  actionName: string,
  operation: () => Promise<T>,
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    return throwSafeActionError(actionName, error);
  }
};

export const requireChildAccess = async (
  context: MarketplaceActionContext,
  childId: number,
  options: { allowLinkedStudent?: boolean } = {},
) => {
  const { data, error } = await context.supabase
    .from('child_profiles')
    .select('id, user_id, student_user_id, avatar_url')
    .eq('id', childId)
    .maybeSingle();

  const child = data as {
    id: number;
    user_id: string;
    student_user_id?: string | null;
    avatar_url?: string | null;
  } | null;

  if (error || !child) {
    actionError('ملف الطفل غير موجود أو لا تملك صلاحية الوصول إليه.');
  }

  if (
    !isDatabaseAdmin(context.actor) &&
    child.user_id !== context.actor.id &&
    (!options.allowLinkedStudent || child.student_user_id !== context.actor.id)
  ) {
    actionError('لا تملك صلاحية إدارة ملف هذا الطفل.');
  }

  return child;
};

type OwnedResourceTable = 'orders' | 'subscriptions' | 'bookings' | 'service_orders';

export const requireResourceOwner = async (
  context: MarketplaceActionContext,
  table: OwnedResourceTable,
  resourceId: string,
) => {
  const { data, error } = await (context.supabase.from(table) as any)
    .select('id, user_id, child_id')
    .eq('id', resourceId)
    .maybeSingle();

  const resource = data as {
    id: string;
    user_id: string;
    child_id?: number | null;
  } | null;

  if (error || !resource) {
    actionError('العنصر المطلوب غير موجود أو لا تملك صلاحية الوصول إليه.');
  }

  if (!isDatabaseAdmin(context.actor) && resource.user_id !== context.actor.id) {
    actionError('لا تملك صلاحية تعديل هذا العنصر.');
  }

  return resource;
};

export type BookingRelationship = 'admin' | 'owner' | 'student' | 'instructor';

export const requireBookingAccess = async (
  context: MarketplaceActionContext,
  bookingId: string,
): Promise<{
  booking: {
    id: string;
    user_id: string;
    child_id: number;
    instructor_id: number;
  };
  relationship: BookingRelationship;
}> => {
  const { data, error } = await context.supabase
    .from('bookings')
    .select('id, user_id, child_id, instructor_id')
    .eq('id', bookingId)
    .maybeSingle();

  const booking = data as {
    id: string;
    user_id: string;
    child_id: number;
    instructor_id: number;
  } | null;

  if (error || !booking) {
    actionError('الحجز غير موجود أو لا تملك صلاحية الوصول إليه.');
  }

  if (isDatabaseAdmin(context.actor)) {
    return { booking, relationship: 'admin' };
  }

  if (booking.user_id === context.actor.id) {
    return { booking, relationship: 'owner' };
  }

  if (context.actor.role === 'student') {
    const child = await requireChildAccess(context, booking.child_id, {
      allowLinkedStudent: true,
    });
    if (child.student_user_id === context.actor.id) {
      return { booking, relationship: 'student' };
    }
  }

  if (context.actor.role === 'instructor') {
    const { data: instructor, error: instructorError } = await context.supabase
      .from('instructors')
      .select('id')
      .eq('user_id', context.actor.id)
      .eq('id', booking.instructor_id)
      .maybeSingle();

    if (!instructorError && instructor) {
      return { booking, relationship: 'instructor' };
    }
  }

  actionError('لا تملك صلاحية الوصول إلى هذا الحجز.');
};

export const requireScheduledSessionManager = async (
  context: MarketplaceActionContext,
  sessionId: string,
) => {
  const { data, error } = await context.supabase
    .from('scheduled_sessions')
    .select('id, booking_id, child_id, instructor_id')
    .eq('id', sessionId)
    .maybeSingle();

  const scheduledSession = data as {
    id: string;
    booking_id?: string | null;
    child_id: number;
    instructor_id: number;
  } | null;

  if (error || !scheduledSession) {
    actionError('الجلسة غير موجودة أو لا تملك صلاحية الوصول إليها.');
  }

  if (isDatabaseAdmin(context.actor)) return scheduledSession;

  if (context.actor.role !== 'instructor') {
    actionError(AUTHORIZATION_ERROR);
  }

  const { data: instructor, error: instructorError } = await context.supabase
    .from('instructors')
    .select('id')
    .eq('id', scheduledSession.instructor_id)
    .eq('user_id', context.actor.id)
    .maybeSingle();

  if (instructorError || !instructor) {
    actionError(AUTHORIZATION_ERROR);
  }

  return scheduledSession;
};
