"use server";

import { auth } from '@clerk/nextjs/server';
import { runWithSupabaseAccessTokenProvider } from '@alrehla/api/lib/supabaseClient';
import { userService as apiUserService } from '@alrehla/api/services/userService';

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

export const updateUser = async (payload: any) => {
  return withClerkSupabaseSession(() => apiUserService.updateUser(payload));
};

export const updateUserPassword = async (payload: any) => {
  return withClerkSupabaseSession(() => apiUserService.updateUserPassword(payload));
};

export const resetStudentPassword = async (payload: any) => {
  return withClerkSupabaseSession(() => apiUserService.resetStudentPassword(payload));
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
