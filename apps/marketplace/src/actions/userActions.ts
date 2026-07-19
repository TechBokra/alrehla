"use server";

import { auth, clerkClient } from '@clerk/nextjs/server';
import { runWithSupabaseAccessTokenProvider, supabase } from '@alrehla/api/lib/supabaseClient';
import { userService as apiUserService } from '@alrehla/api/services/userService';


type CreateStudentAccountPayload = {
  name: string;
  email: string;
  password?: string;
  childProfileId: number;
};

type ResetStudentPasswordPayload = {
  studentUserId: string;
  newPassword: string;
};

const normalizeEmail = (email: string) => email.toLowerCase().trim();

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

  if (message.includes('already has a linked student account')) {
    return 'هذا الطفل مرتبط بالفعل بحساب طالب.';
  }

  if (message.includes('not owned by current parent')) {
    return 'لا يمكنك إنشاء حساب طالب لهذا الملف لأنه غير مرتبط بحسابك.';
  }

  if (message.includes('Student email already exists')) {
    return 'البريد الإلكتروني المقترح مستخدم بالفعل. غيّر اسم الطالب الإنجليزي ثم حاول مرة أخرى.';
  }

  if (message.includes('function') || error?.code === 'PGRST202') {
    return 'قاعدة البيانات لا تحتوي بعد على دوال ربط حسابات الطلاب مع Clerk. شغّل supabase/02_clerk_auth.sql أو supabase/02_clerk_auth_minimal.sql ثم أعد المحاولة.';
  }

  return message || 'تعذر ربط حساب الطالب بقاعدة البيانات.';
};

const assertStudentPassword = (password: string) => {
  if (!password || password.length < 8) {
    throw new Error('كلمة مرور الطالب يجب أن تكون 8 أحرف على الأقل حتى يقبلها Clerk.');
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

export const getAllUsers = async (options?: any) => {
  return withClerkSupabaseSession(() => apiUserService.getAllUsers(options));
};

export const isEmailTaken = async (email: string) => {
  return apiUserService.isEmailTaken(email);
};

export const createUser = async (payload: any) => {
  return withClerkSupabaseSession(() => apiUserService.createUser(payload));
};

export const createAndLinkStudentAccount = async (payload: CreateStudentAccountPayload) => {
  const normalizedEmail = normalizeEmail(payload.email || '');
  const password = payload.password || '';
  const name = payload.name?.trim() || normalizedEmail.split('@')[0] || 'طالب الرحلة';

  if (!normalizedEmail) throw new Error('البريد الإلكتروني مطلوب لإنشاء حساب الطالب.');
  if (!payload.childProfileId) throw new Error('ملف الطفل غير محدد.');
  assertStudentPassword(password);

  await withClerkSupabaseSession(async () => {
    const { data: child, error } = await supabase
      .from('child_profiles')
      .select('id, student_user_id')
      .eq('id', payload.childProfileId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!child) throw new Error('لا يمكنك إنشاء حساب طالب لهذا الملف لأنه غير مرتبط بحسابك.');
    if ((child as any).student_user_id) throw new Error('هذا الطفل مرتبط بالفعل بحساب طالب.');
  });

  const clerk = await clerkClient();
  let clerkUserId: string | null = null;

  try {
    const clerkUser = await clerk.users.createUser({
      emailAddress: [normalizedEmail],
      emailAddressIdentificationStatus: ['reserved'],
      password,
      firstName: name,
      publicMetadata: {
        role: 'student',
        appRole: 'student',
        managedBy: 'parent',
        childProfileId: String(payload.childProfileId),
      },
      unsafeMetadata: {
        role: 'student',
        name,
        childProfileId: payload.childProfileId,
      },
    } as any);

    clerkUserId = clerkUser.id;

    const profile = await withClerkSupabaseSession(async () => {
      const { data, error } = await (supabase.rpc as any)('create_parent_managed_student_profile', {
        p_child_profile_id: payload.childProfileId,
        p_clerk_user_id: clerkUser.id,
        p_email: normalizedEmail,
        p_name: name,
      });

      if (error) throw new Error(getDatabaseErrorMessage(error));
      if (!data?.id) throw new Error('تم إنشاء مستخدم Clerk لكن لم يرجع Supabase ملف الطالب.');
      return data;
    });

    return profile;
  } catch (error: any) {
    if (clerkUserId) {
      try {
        await clerk.users.deleteUser(clerkUserId);
      } catch (cleanupError) {
        console.error('Failed to clean up orphan Clerk student user', cleanupError);
      }
    }

    throw new Error(getClerkErrorMessage(error));
  }
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

export const updateUser = async (payload: any) => {
  return withClerkSupabaseSession(() => apiUserService.updateUser(payload));
};

export const updateUserPassword = async (payload: any) => {
  return withClerkSupabaseSession(() => apiUserService.updateUserPassword(payload));
};

export const resetStudentPassword = async (payload: ResetStudentPasswordPayload) => {
  const studentUserId = payload.studentUserId?.trim();
  const newPassword = payload.newPassword || '';

  if (!studentUserId) throw new Error('حساب الطالب غير محدد.');
  assertStudentPassword(newPassword);

  const clerkUserId = await withClerkSupabaseSession(async () => {
    const { data, error } = await (supabase.rpc as any)('get_parent_managed_student_clerk_user_id', {
      p_student_profile_id: studentUserId,
    });

    if (error) throw new Error(getDatabaseErrorMessage(error));
    if (!data) throw new Error('لم يتم العثور على حساب Clerk المرتبط بهذا الطالب.');
    return data as string;
  });

  try {
    const clerk = await clerkClient();
    await clerk.users.updateUser(clerkUserId, {
      password: newPassword,
      signOutOfOtherSessions: true,
    });

    return { success: true };
  } catch (error: any) {
    throw new Error(getClerkErrorMessage(error));
  }
};

export const bulkDeleteUsers = async (userIds: string[]) => {
  return withClerkSupabaseSession(() => apiUserService.bulkDeleteUsers(userIds));
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
