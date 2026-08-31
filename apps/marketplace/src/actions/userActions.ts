"use server";

import { clerkClient } from '@clerk/nextjs/server';
import { ensureClerkProfile } from '@alrehla/api-client/resources/auth';
import { userService as apiUserService } from '@alrehla/api/services/userService';
import type { UserProfile, UserRole } from '@alrehla/types';
import {
  createChildProfileSchema,
  createUserSchema,
  emailSchema,
  idListSchema,
  linkStudentSchema,
  listOptionsSchema,
  managedStudentAccountSchema,
  numericIdSchema,
  passwordUpdateSchema,
  publisherProfileSchema,
  resetStudentPasswordSchema,
  resourceIdSchema,
  updateChildProfileSchema,
  updateCurrentUserSchema,
} from '../lib/server/actionSchemas';
import {
  MARKETPLACE_ROLES,
  MarketplaceActionError,
  actionError,
  isDatabaseAdmin,
  parseActionInput,
  requireChildAccess,
  revalidateMarketplaceTags,
  withClerkSessionAction,
  withMarketplaceAction,
} from '../lib/server/actionSecurity';
import { normalizeSignedChildAvatar } from '../lib/server/childAvatar';

const SELF_MANAGED_ROLES = [
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
] as const satisfies readonly UserRole[];

const PARENT_ROLES = [
  'user',
  'parent',
  ...MARKETPLACE_ROLES.databaseAdmins,
] as const satisfies readonly UserRole[];

const PUBLISHER_ROLES = [
  'publisher',
  ...MARKETPLACE_ROLES.databaseAdmins,
] as const satisfies readonly UserRole[];

const getClerkErrorMessage = (error: unknown) => {
  const clerkCode =
    error && typeof error === 'object'
      ? (error as any)?.errors?.[0]?.code || (error as any)?.code
      : undefined;

  if (clerkCode === 'form_identifier_exists') {
    return 'البريد الإلكتروني مستخدم بالفعل في حساب آخر.';
  }
  if (clerkCode === 'form_password_pwned') {
    return 'كلمة المرور غير آمنة. اختر كلمة مرور مختلفة.';
  }
  if (clerkCode === 'form_password_length_too_short') {
    return 'كلمة المرور أقصر من الحد المسموح.';
  }
  if (
    clerkCode === 'form_password_incorrect' ||
    clerkCode === 'verification_failed'
  ) {
    return 'كلمة المرور الحالية غير صحيحة.';
  }

  return 'تعذر تنفيذ عملية الحساب لدى مزود تسجيل الدخول. حاول مرة أخرى.';
};

const getDatabaseErrorMessage = (error: unknown) => {
  const message =
    error && typeof error === 'object' && 'message' in error
      ? String((error as { message?: unknown }).message || '')
      : '';
  const code =
    error && typeof error === 'object' && 'code' in error
      ? String((error as { code?: unknown }).code || '')
      : '';

  if (message.includes('already has a linked student account')) {
    return 'هذا الطفل مرتبط بالفعل بحساب طالب.';
  }
  if (message.includes('not owned by current parent')) {
    return 'لا يمكنك إدارة حساب طالب لهذا الملف.';
  }
  if (message.includes('Student email already exists') || code === '23505') {
    return 'البريد الإلكتروني المقترح مستخدم بالفعل.';
  }
  if (message.includes('Not authenticated')) {
    return 'تعذر التحقق من جلسة التسجيل. يرجى إعادة تسجيل الدخول.';
  }
  if (message.includes('Invalid student email')) {
    return 'صيغة البريد الإلكتروني للطفل غير صحيحة.';
  }
  if (message.includes('Clerk user is already linked')) {
    return 'حساب الدخول مرتبط بالفعل ببروفايل آخر.';
  }
  if (
    code === 'PGRST301' ||
    message.includes('no suitable key') ||
    message.includes('wrong key type') ||
    message.includes('jwt')
  ) {
    return 'تعذر التحقق من جلسة Clerk عبر Supabase. تحقق من إعداد Clerk Third-Party Auth في مشروع Supabase نفسه ثم أعد المحاولة.';
  }
  if (code === 'PGRST202' || code === '42883') {
    return 'تعذر إكمال ربط حساب الطالب حالياً.';
  }

  return 'تعذر حفظ بيانات حساب الطالب.';
};

const definedEntries = <T extends Record<string, unknown>>(value: T) =>
  Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  ) as Partial<T>;

/**
 * Establishes the Supabase profile from authoritative Clerk server data.
 * The browser supplies no identity, email, name, or role input.
 */
export const syncCurrentClerkProfile = async () =>
  withClerkSessionAction('user.syncCurrentClerkProfile', async ({ clerkUserId, apiClient }) => {
    const clerk = await clerkClient();
    const clerkUser = await clerk.users.getUser(clerkUserId);
    const email = (
      clerkUser.primaryEmailAddress?.emailAddress ||
      clerkUser.emailAddresses[0]?.emailAddress ||
      ''
    )
      .trim()
      .toLowerCase();

    if (!emailSchema.safeParse(email).success) {
      actionError('لم نتمكن من قراءة بريد إلكتروني صالح من حساب Clerk.');
    }

    const name =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ').trim() ||
      clerkUser.username?.trim() ||
      email.split('@')[0] ||
      'مستخدم الرحلة';

    try {
      return await ensureClerkProfile(apiClient, {
        email,
        name: name.slice(0, 120),
      });
    } catch (error) {
      actionError(getDatabaseErrorMessage(error));
    }
  });

export const getAllUsers = async (options?: any) => {
  const input = parseActionInput(listOptionsSchema, options || {});
  return withMarketplaceAction(
    'user.getAllUsers',
    () => apiUserService.getAllUsers(input),
    MARKETPLACE_ROLES.databaseAdmins,
  );
};

export const isEmailTaken = async (email: string) => {
  const input = parseActionInput(emailSchema, email);
  return withMarketplaceAction(
    'user.isEmailTaken',
    () => apiUserService.isEmailTaken(input),
    MARKETPLACE_ROLES.databaseAdmins,
  );
};

export const createUser = async (payload: any) => {
  const input = parseActionInput(createUserSchema, payload) as {
    name: string;
    email: string;
    role: UserRole;
    phone?: string;
    address?: string;
    clerkUserId: string;
  };
  return withMarketplaceAction(
    'user.createUser',
    async () => {
      const result = await apiUserService.createUser(input);
      revalidateMarketplaceTags('marketplace:users');
      return result;
    },
    MARKETPLACE_ROLES.databaseAdmins,
  );
};

export const createAndLinkStudentAccount = async (payload: {
  name: string;
  email: string;
  password?: string;
  childProfileId: number;
}) => {
  const input = parseActionInput(managedStudentAccountSchema, payload);

  return withMarketplaceAction(
    'user.createAndLinkStudentAccount',
    async (context) => {
      const child = await requireChildAccess(context, input.childProfileId);
      if (child.student_user_id) {
        actionError('هذا الطفل مرتبط بالفعل بحساب طالب.');
      }

      const clerk = await clerkClient();
      let createdClerkUserId: string | null = null;

      try {
        const clerkUser = await clerk.users.createUser({
          emailAddress: [input.email],
          emailAddressIdentificationStatus: ['reserved'],
          password: input.password,
          firstName: input.name,
          publicMetadata: {
            role: 'student',
            appRole: 'student',
            accountType: 'student',
            globalRole: null,
            managedBy: 'parent',
            childProfileId: String(input.childProfileId),
          },
          unsafeMetadata: {
            name: input.name,
            childProfileId: input.childProfileId,
          },
        } as any);

        createdClerkUserId = clerkUser.id;

        const { data, error } = await (context.supabase.rpc as any)(
          'create_parent_managed_student_profile',
          {
            p_child_profile_id: input.childProfileId,
            p_clerk_user_id: clerkUser.id,
            p_email: input.email,
            p_name: input.name,
          },
        );

        if (error) {
          console.error('[marketplace-action:user.createAndLinkStudentAccount] DB error:', error);
          actionError(getDatabaseErrorMessage(error));
        }
        if (!data?.id) {
          actionError('تم إنشاء حساب الدخول لكن تعذر ربط ملف الطالب.');
        }

        revalidateMarketplaceTags(
          `marketplace:account:${context.actor.id}`,
          'marketplace:users',
        );
        return data;
      } catch (error) {
        if (createdClerkUserId) {
          try {
            await clerk.users.deleteUser(createdClerkUserId);
          } catch {
            console.error('[marketplace-action:user.createAndLinkStudentAccount] orphan cleanup failed');
          }
        }

        if (error instanceof MarketplaceActionError) throw error;
        actionError(getClerkErrorMessage(error));
      }
    },
    PARENT_ROLES,
  );
};

export const linkStudentToChildProfile = async (payload: any) => {
  const input = parseActionInput(linkStudentSchema, payload) as {
    studentUserId: string;
    childProfileId: number;
  };
  return withMarketplaceAction(
    'user.linkStudentToChildProfile',
    async (context) => {
      await requireChildAccess(context, input.childProfileId);

      const { data: student, error } = await context.supabase
        .from('profiles')
        .select('id, role')
        .eq('id', input.studentUserId)
        .maybeSingle();

      if (error || !student || (student as any).role !== 'student') {
        actionError('حساب الطالب غير موجود أو غير صالح للربط.');
      }

      const result = await apiUserService.linkStudentToChildProfile(input);
      revalidateMarketplaceTags('marketplace:users');
      return result;
    },
    MARKETPLACE_ROLES.databaseAdmins,
  );
};

export const unlinkStudentFromChildProfile = async (childProfileId: number) => {
  const childId = parseActionInput(numericIdSchema, childProfileId);
  return withMarketplaceAction(
    'user.unlinkStudentFromChildProfile',
    async (context) => {
      await requireChildAccess(context, childId);
      const result = await apiUserService.unlinkStudentFromChildProfile(childId);
      revalidateMarketplaceTags(
        `marketplace:account:${context.actor.id}`,
        'marketplace:users',
      );
      return result;
    },
    PARENT_ROLES,
  );
};

export const createChildProfile = async (payload: any) => {
  const input = parseActionInput(createChildProfileSchema, payload);
  return withMarketplaceAction(
    'user.createChildProfile',
    async (context) => {
      const avatarUrl = normalizeSignedChildAvatar(
        input.avatar_url,
        context.actor.id,
      );
      const result = await apiUserService.createChildProfile({
        ...input,
        avatar_url: avatarUrl,
        user_id: context.actor.id,
      });
      revalidateMarketplaceTags(
        `marketplace:account:${context.actor.id}`,
        'marketplace:children',
      );
      return result;
    },
    PARENT_ROLES,
  );
};

export const updateChildProfile = async (payload: any) => {
  const input = parseActionInput(updateChildProfileSchema, payload) as {
    id: number;
    name?: string;
    birth_date?: string;
    gender?: 'ذكر' | 'أنثى';
    avatar_url?: string | null;
    interests?: string[] | null;
    strengths?: string[] | null;
  };
  return withMarketplaceAction(
    'user.updateChildProfile',
    async (context) => {
      const child = await requireChildAccess(context, input.id);
      const hasAvatarUpdate = Object.prototype.hasOwnProperty.call(
        input,
        'avatar_url',
      );
      let avatarUrl = input.avatar_url;

      if (hasAvatarUpdate && avatarUrl !== child.avatar_url) {
        avatarUrl = normalizeSignedChildAvatar(
          avatarUrl,
          context.actor.id,
        );
      }

      const result = await apiUserService.updateChildProfile({
        ...input,
        ...(hasAvatarUpdate ? { avatar_url: avatarUrl } : {}),
      });
      revalidateMarketplaceTags(
        `marketplace:account:${context.actor.id}`,
        `marketplace:child:${input.id}`,
      );
      return result;
    },
    PARENT_ROLES,
  );
};

export const deleteChildProfile = async (childId: number) => {
  const input = parseActionInput(numericIdSchema, childId);
  return withMarketplaceAction(
    'user.deleteChildProfile',
    async (context) => {
      await requireChildAccess(context, input);
      const result = await apiUserService.deleteChildProfile(input);
      revalidateMarketplaceTags(
        `marketplace:account:${context.actor.id}`,
        'marketplace:children',
      );
      return result;
    },
    PARENT_ROLES,
  );
};

export const getAllChildProfiles = async (userIds?: string[]) => {
  const input = userIds ? parseActionInput(idListSchema, userIds) : undefined;
  return withMarketplaceAction(
    'user.getAllChildProfiles',
    () => apiUserService.getAllChildProfiles(input),
    MARKETPLACE_ROLES.databaseAdmins,
  );
};

export const updateUser = async (payload: any) => {
  const input = parseActionInput(updateCurrentUserSchema, payload);
  return withMarketplaceAction(
    'user.updateUser',
    async (context) => {
      const { id: _ignoredClientId, ...requestedUpdates } = input;
      const updates = definedEntries(requestedUpdates);
      const result = await apiUserService.updateUser({
        ...updates,
        id: context.actor.id,
      });
      revalidateMarketplaceTags(`marketplace:account:${context.actor.id}`);
      return result;
    },
    SELF_MANAGED_ROLES,
  );
};

export const updateUserPassword = async (payload: any) => {
  const input = parseActionInput(passwordUpdateSchema, payload) as {
    currentPassword: string;
    newPassword: string;
  };
  return withMarketplaceAction(
    'user.updateUserPassword',
    async (context) => {
      if (input.currentPassword === input.newPassword) {
        actionError('يجب أن تختلف كلمة المرور الجديدة عن الحالية.');
      }

      try {
        const clerk = await clerkClient();
        await clerk.users.verifyPassword({
          userId: context.clerkUserId,
          password: input.currentPassword,
        });
        await clerk.users.updateUser(context.clerkUserId, {
          password: input.newPassword,
          signOutOfOtherSessions: true,
        });
        return { success: true };
      } catch (error) {
        actionError(getClerkErrorMessage(error));
      }
    },
    SELF_MANAGED_ROLES,
  );
};

export const resetStudentPassword = async (payload: {
  studentUserId: string;
  newPassword: string;
}) => {
  const input = parseActionInput(resetStudentPasswordSchema, payload);

  return withMarketplaceAction(
    'user.resetStudentPassword',
    async (context) => {
      const { data, error } = await (context.supabase.rpc as any)(
        'get_parent_managed_student_clerk_user_id',
        {
          p_student_profile_id: input.studentUserId,
        },
      );

      if (error || !data) {
        actionError(getDatabaseErrorMessage(error));
      }

      try {
        const clerk = await clerkClient();
        await clerk.users.updateUser(data as string, {
          password: input.newPassword,
          signOutOfOtherSessions: true,
        });
        return { success: true };
      } catch (error) {
        actionError(getClerkErrorMessage(error));
      }
    },
    ['parent', ...MARKETPLACE_ROLES.databaseAdmins],
  );
};

export const bulkDeleteUsers = async (userIds: string[]) => {
  const input = parseActionInput(idListSchema, userIds);
  return withMarketplaceAction(
    'user.bulkDeleteUsers',
    async (context) => {
      if (input.includes(context.actor.id)) {
        actionError('لا يمكنك حذف حسابك من هذه العملية.');
      }
      const result = await apiUserService.bulkDeleteUsers(input);
      revalidateMarketplaceTags('marketplace:users');
      return result;
    },
    MARKETPLACE_ROLES.databaseAdmins,
  );
};

export const getPublisherProfile = async (userId: string) => {
  const input = parseActionInput(resourceIdSchema, userId);
  return withMarketplaceAction(
    'user.getPublisherProfile',
    (context) =>
      apiUserService.getPublisherProfile(
        isDatabaseAdmin(context.actor) ? input : context.actor.id,
      ),
    PUBLISHER_ROLES,
  );
};

export const updatePublisherProfile = async (payload: any) => {
  const input = parseActionInput(publisherProfileSchema, payload);
  return withMarketplaceAction(
    'user.updatePublisherProfile',
    async (context) => {
      const { user_id: _ignoredClientId, ...profile } = input;
      const result = await apiUserService.updatePublisherProfile({
        ...profile,
        user_id: context.actor.id,
      });
      revalidateMarketplaceTags(
        `marketplace:publisher:${context.actor.id}`,
        'marketplace:products',
      );
      return result;
    },
    PUBLISHER_ROLES,
  );
};

export const mergeDuplicateChildren = async () =>
  withMarketplaceAction(
    'user.mergeDuplicateChildren',
    async () => {
      const result = await apiUserService.mergeDuplicateChildren();
      revalidateMarketplaceTags('marketplace:children');
      return result;
    },
    MARKETPLACE_ROLES.databaseAdmins,
  );
