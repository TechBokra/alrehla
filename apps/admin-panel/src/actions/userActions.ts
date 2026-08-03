"use server";

import { auth, clerkClient } from '@clerk/nextjs/server';
import { runWithSupabaseAccessTokenProvider, supabase } from '@alrehla/api/lib/supabaseClient';
import { userService as apiUserService } from '@alrehla/api/services/userService';
import type { UserRole } from '../lib/database.types';

type AdminCreateUserPayload = {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  phone?: string;
  address?: string;
};

type AdminUpdateUserPayload = {
  id: string;
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  phone?: string;
  address?: string;
  governorate?: string;
  city?: string;
  country?: string;
  timezone?: string;
  currency?: string;
};

const normalizeEmail = (email: string) => email.toLowerCase().trim();

const getRoleMetadata = (role: UserRole) => ({
  accountType: role === 'student' ? 'student' : 'parent',
  globalRole:
    role === 'super_admin'
      ? 'super_admin'
      : role === 'support_agent'
        ? 'support_admin'
        : null,
});

const getClerkErrorMessage = (error: any) => {
  return (
    error?.errors?.[0]?.longMessage ||
    error?.errors?.[0]?.message ||
    error?.longMessage ||
    error?.message ||
    'تعذر تنفيذ عملية Clerk. تحقق من إعدادات Clerk وحاول مرة أخرى.'
  );
};

const getDatabaseErrorMessage = (error: any) => {
  const message = error?.message || '';

  if (message.includes('permission denied') || error?.code === '42501') {
    return 'ليست لديك صلاحية كافية لإدارة المستخدمين.';
  }

  if (message.includes('duplicate key') || error?.code === '23505') {
    return 'يوجد حساب آخر بنفس البريد الإلكتروني أو معرف Clerk.';
  }

  return message || 'تعذر تنفيذ العملية في قاعدة البيانات.';
};

const assertPassword = (password: string, required = true) => {
  if (!password && !required) return;
  if (!password || password.trim().length === 0) {
    throw new Error('كلمة المرور مطلوب إدخالها.');
  }
  if (password.length < 8) {
    throw new Error('كلمة المرور يجب أن تتكون من 8 أحرف على الأقل حتى يقبلها نظام Clerk.');
  }
};

const withClerkSupabaseSession = async <T>(operation: () => Promise<T>) => {
  const session = await auth();

  if (!session.userId) {
    throw new Error('جلسة غير صالحة');
  }

  return runWithSupabaseAccessTokenProvider(async () => {
    const token = await session.getToken();
    if (!token) {
      throw new Error('تعذر قراءة جلسة Clerk الحالية. أعد تسجيل الدخول ثم حاول مرة أخرى.');
    }

    return token;
  }, operation);
};

const getProfileForAdmin = async (profileId: string) => {
  return withClerkSupabaseSession(async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .maybeSingle();

    if (error) throw new Error(getDatabaseErrorMessage(error));
    if (!data) throw new Error('لم يتم العثور على المستخدم.');
    return data as any;
  });
};

export const getAllUsers = async (options?: any) => {
  return withClerkSupabaseSession(() => apiUserService.getAllUsers(options));
};

export const isEmailTaken = async (email: string) => {
  return withClerkSupabaseSession(() => apiUserService.isEmailTaken(email));
};

export const createUser = async (payload: AdminCreateUserPayload) => {
  const normalizedEmail = normalizeEmail(payload.email || '');
  const name = payload.name?.trim() || normalizedEmail.split('@')[0] || 'مستخدم الرحلة';
  const role = payload.role || 'user';
  const password = payload.password || '';

  if (!normalizedEmail) throw new Error('البريد الإلكتروني مطلوب.');
  assertPassword(password, true);

  const clerk = await clerkClient();
  let clerkUserId: string | null = null;

  try {
    const clerkUser = await clerk.users.createUser({
      emailAddress: [normalizedEmail],
      emailAddressIdentificationStatus: ['reserved'],
      password,
      firstName: name,
      publicMetadata: {
        role,
        appRole: role,
        ...getRoleMetadata(role),
      },
      unsafeMetadata: {
        role,
        name,
      },
    } as any);

    clerkUserId = clerkUser.id;

    return await withClerkSupabaseSession(() => apiUserService.createUser({
      ...payload,
      name,
      email: normalizedEmail,
      role,
      clerkUserId: clerkUser.id,
    }));
  } catch (error: any) {
    if (clerkUserId) {
      try {
        await clerk.users.deleteUser(clerkUserId);
      } catch (cleanupError) {
        console.error('Failed to clean up orphan Clerk admin-created user', cleanupError);
      }
    }

    throw new Error(getClerkErrorMessage(error));
  }
};

export const updateUser = async (payload: AdminUpdateUserPayload) => {
  const { id, password, role, ...profileUpdates } = payload;
  if (!id) throw new Error('معرف المستخدم مطلوب.');
  assertPassword(password || '', false);

  const beforeProfile = await getProfileForAdmin(id);

  let updatedProfile = await withClerkSupabaseSession(async () => {
    const updates = {
      ...(() => {
        const { email: _email, ...safeProfileUpdates } = profileUpdates;
        return safeProfileUpdates;
      })(),
    } as any;

    delete updates.password;
    if (updates.email) updates.email = normalizeEmail(updates.email);

    const { data, error } = await (supabase.from('profiles') as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(getDatabaseErrorMessage(error));
    return data as any;
  });

  if (role) {
    updatedProfile = await withClerkSupabaseSession(async () => {
      const { data, error } = await (supabase.rpc as any)('change_user_role', {
        p_target_profile_id: id,
        p_role: role,
      });
      if (error) throw new Error(getDatabaseErrorMessage(error));
      return data as any;
    });
  }

  const clerkUserId = beforeProfile.clerk_user_id;
  if (clerkUserId) {
    try {
      const clerk = await clerkClient();
      const clerkUser = await clerk.users.getUser(clerkUserId);
      const nextRole = role || updatedProfile.role;
      const nextName = updatedProfile.name || beforeProfile.name;

      await clerk.users.updateUser(clerkUserId, {
        ...(password ? { password, signOutOfOtherSessions: true } : {}),
        firstName: nextName,
        publicMetadata: {
          ...(clerkUser.publicMetadata || {}),
          role: nextRole,
          appRole: nextRole,
          ...getRoleMetadata(nextRole),
        },
        unsafeMetadata: {
          ...(clerkUser.unsafeMetadata || {}),
          role: nextRole,
          name: nextName,
        },
      });
    } catch (error: any) {
      throw new Error(getClerkErrorMessage(error));
    }
  } else if (password) {
    throw new Error('هذا الملف غير مرتبط بحساب Clerk، لذلك لا يمكن تغيير كلمة المرور.');
  }

  return updatedProfile;
};

export const updateUserPassword = async (payload: { userId: string; newPassword: string }) => {
  return updateUser({ id: payload.userId, password: payload.newPassword });
};

export const bulkDeleteUsers = async (userIds: string[]) => {
  const ids = [...new Set((userIds || []).filter(Boolean))];
  if (ids.length === 0) return { success: true };

  const profiles = await withClerkSupabaseSession(async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, clerk_user_id')
      .in('id', ids);

    if (error) throw new Error(getDatabaseErrorMessage(error));
    return (data || []) as Array<{ id: string; clerk_user_id?: string | null }>;
  });

  await withClerkSupabaseSession(() => apiUserService.bulkDeleteUsers(ids));

  const clerk = await clerkClient();
  const deleteResults = await Promise.allSettled(
    profiles
      .map((profile) => profile.clerk_user_id)
      .filter((clerkUserId): clerkUserId is string => Boolean(clerkUserId))
      .map((clerkUserId) => clerk.users.deleteUser(clerkUserId)),
  );

  deleteResults.forEach((result) => {
    if (result.status === 'rejected') {
      console.error('Failed to delete Clerk user after profile deletion', result.reason);
    }
  });

  return { success: true };
};

export const createAndLinkStudentAccount = async (payload: any) => {
  return withClerkSupabaseSession(() => apiUserService.createAndLinkStudentAccount(payload));
};

export const linkStudentToChildProfile = async (payload: any) => {
  return withClerkSupabaseSession(() => apiUserService.linkStudentToChildProfile(payload));
};

export const unlinkStudentFromChildProfile = async (childProfileId: number) => {
  return withClerkSupabaseSession(() => apiUserService.unlinkStudentFromChildProfile(childProfileId));
};

export const createChildProfile = async (payload: any) => {
  return withClerkSupabaseSession(() => apiUserService.createChildProfile(payload));
};

export const updateChildProfile = async (payload: any) => {
  return withClerkSupabaseSession(() => apiUserService.updateChildProfile(payload));
};

export const deleteChildProfile = async (childId: number) => {
  return withClerkSupabaseSession(() => apiUserService.deleteChildProfile(childId));
};

export const getAllChildProfiles = async (userIds?: string[]) => {
  return withClerkSupabaseSession(() => apiUserService.getAllChildProfiles(userIds));
};

export const resetStudentPassword = async (payload: any) => {
  return updateUser({ id: payload.studentUserId, password: payload.newPassword });
};

export const getPublisherProfile = async (userId: string) => {
  return apiUserService.getPublisherProfile(userId);
};

export const updatePublisherProfile = async (payload: any) => {
  return withClerkSupabaseSession(() => apiUserService.updatePublisherProfile(payload));
};

export const mergeDuplicateChildren = async () => {
  return withClerkSupabaseSession(() => apiUserService.mergeDuplicateChildren());
};
