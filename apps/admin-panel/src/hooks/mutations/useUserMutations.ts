import { useAdminMutation } from '@alrehla/admin-core';
import { accountKeys, childProfileKeys, publicDataKeys, publisherKeys, userKeys } from '@alrehla/api';
import { useToast } from '../../contexts/ToastContext';
import { userService } from '../../services/userService';
import type { PublisherProfile } from '../../lib/database.types';

const userInvalidations = [userKeys.lists(), childProfileKeys.lists(), accountKeys.all] as const;

export const useUserMutations = () => {
  const { addToast } = useToast();
  const createUser = useAdminMutation({
    resource: 'users', mutationFn: userService.createUser, invalidate: [userKeys.lists()],
    onSuccess: () => addToast('تم إنشاء المستخدم بنجاح.', 'success'),
    onError: (error) => addToast(`فشل إنشاء المستخدم: ${error.message}`, 'error'),
  });
  const updateUser = useAdminMutation({
    resource: 'users', mutationFn: userService.updateUser, invalidate: [userKeys.lists(), accountKeys.all],
    onSuccess: () => addToast('تم تحديث بيانات المستخدم بنجاح.', 'success'),
    onError: (error) => addToast(`فشل تحديث المستخدم: ${error.message}`, 'error'),
  });
  const updateUserPassword = useAdminMutation({
    resource: 'users', mutationFn: userService.updateUserPassword,
    onSuccess: () => addToast('تم تحديث كلمة المرور بنجاح.', 'success'),
    onError: (error) => addToast(`فشل تحديث كلمة المرور: ${error.message}`, 'error'),
  });
  const createChildProfile = useAdminMutation({
    resource: 'users', mutationFn: userService.createChildProfile, invalidate: userInvalidations,
    onSuccess: () => addToast('تمت إضافة الطفل بنجاح.', 'success'),
    onError: (error) => addToast(`فشل إضافة الطفل: ${error.message}`, 'error'),
  });
  const updateChildProfile = useAdminMutation({
    resource: 'users', mutationFn: userService.updateChildProfile, invalidate: userInvalidations,
    onSuccess: () => addToast('تم تحديث ملف الطفل بنجاح.', 'success'),
    onError: (error) => addToast(`فشل تحديث الملف: ${error.message}`, 'error'),
  });
  const deleteChildProfile = useAdminMutation({
    resource: 'users', mutationFn: ({ childId }: { childId: number }) => userService.deleteChildProfile(childId), invalidate: userInvalidations,
    onSuccess: () => addToast('تم حذف ملف الطفل بنجاح.', 'info'),
    onError: (error) => addToast(`فشل حذف الملف: ${error.message}`, 'error'),
  });
  const createAndLinkStudentAccount = useAdminMutation({
    resource: 'users', mutationFn: userService.createAndLinkStudentAccount, invalidate: userInvalidations,
    onSuccess: () => addToast('تم إنشاء وربط حساب الطالب بنجاح.', 'success'),
    onError: (error) => addToast(`فشل إنشاء الحساب: ${error.message}`, 'error'),
  });
  const linkStudentToChildProfile = useAdminMutation({
    resource: 'users', mutationFn: userService.linkStudentToChildProfile, invalidate: [userKeys.lists(), childProfileKeys.lists()],
    onSuccess: () => addToast('تم ربط الحساب بنجاح.', 'success'),
    onError: (error) => addToast(`فشل الربط: ${error.message}`, 'error'),
  });
  const unlinkStudentFromChildProfile = useAdminMutation({
    resource: 'users', mutationFn: ({ childProfileId }: { childProfileId: number }) => userService.unlinkStudentFromChildProfile(childProfileId), invalidate: [userKeys.lists(), childProfileKeys.lists()],
    onSuccess: () => addToast('تم إلغاء ربط الحساب بنجاح.', 'info'),
    onError: (error) => addToast(`فشل إلغاء الربط: ${error.message}`, 'error'),
  });
  const resetStudentPassword = useAdminMutation({
    resource: 'users', mutationFn: userService.resetStudentPassword,
    onSuccess: () => addToast('تم تغيير كلمة المرور بنجاح.', 'success'),
    onError: (error) => addToast(`فشل تغيير كلمة المرور: ${error.message}`, 'error'),
  });
  const bulkDeleteUsers = useAdminMutation({
    resource: 'users', mutationFn: ({ userIds }: { userIds: string[] }) => userService.bulkDeleteUsers(userIds), invalidate: userInvalidations,
    onSuccess: () => addToast('تم حذف المستخدمين والبيانات المرتبطة بهم بنجاح.', 'info'),
    onError: (error) => addToast(`فشل حذف المستخدمين: ${error.message}`, 'error'),
  });
  const updatePublisherProfile = useAdminMutation({
    resource: 'users', mutationFn: (payload: Partial<PublisherProfile> & { user_id: string }) => userService.updatePublisherProfile(payload), invalidate: [publisherKeys.details(), publicDataKeys.all],
    onSuccess: () => addToast('تم تحديث ملف دار النشر بنجاح.', 'success'),
    onError: (error) => addToast(`فشل تحديث ملف دار النشر: ${error.message}`, 'error'),
  });

  return { createUser, updateUser, updateUserPassword, createChildProfile, updateChildProfile, deleteChildProfile, createAndLinkStudentAccount, linkStudentToChildProfile, unlinkStudentFromChildProfile, resetStudentPassword, bulkDeleteUsers, updatePublisherProfile };
};
