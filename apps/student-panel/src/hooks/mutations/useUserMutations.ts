
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../contexts/ToastContext';
import { userService } from '../../services/userService';
import type { PublisherProfile } from '../../lib/database.types';

export const useUserMutations = () => {
    const queryClient = useQueryClient();
    const { addToast } = useToast();

    // Admin mutation to create a user profile
    const createUser = useMutation({
        mutationFn: userService.createUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
            addToast('تم إنشاء المستخدم بنجاح.', 'success');
        },
        onError: (error: Error) => {
            let msg = error.message;
            if (msg.includes('profiles_id_fkey') || msg.includes('violates foreign key constraint')) {
                msg = "تعذر إنشاء الملف الشخصي. يرجى التحقق من إعدادات قاعدة البيانات.";
            }
            addToast(`فشل إنشاء المستخدم: ${msg}`, 'error');
        }
    });

    // Admin mutation to update any user
    const updateUser = useMutation({
        mutationFn: userService.updateUser,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
            queryClient.invalidateQueries({ queryKey: ['userAccountData'] }); 
            addToast('تم تحديث بيانات المستخدم بنجاح.', 'success');
        },
        onError: (error: Error) => addToast(`فشل تحديث المستخدم: ${error.message}`, 'error')
    });

    const updateUserPassword = useMutation({
         mutationFn: userService.updateUserPassword,
        onSuccess: () => {
            addToast('تم تحديث كلمة المرور بنجاح.', 'success');
        },
        onError: (error: Error) => addToast(`فشل تحديث كلمة المرور: ${error.message}`, 'error')
    });
    
    // Child Profile Mutations (for parents)
    const createChildProfile = useMutation({
        mutationFn: userService.createChildProfile,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['userAccountData'] });
             queryClient.invalidateQueries({ queryKey: ['adminAllChildProfiles'] });
            addToast('تمت إضافة الطفل بنجاح.', 'success');
        },
        onError: (error: Error) => addToast(`فشل إضافة الطفل: ${error.message}`, 'error')
    });

    const updateChildProfile = useMutation({
        mutationFn: userService.updateChildProfile,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['userAccountData'] });
            queryClient.invalidateQueries({ queryKey: ['adminAllChildProfiles'] });
            addToast('تم تحديث ملف الطفل بنجاح.', 'success');
        },
        onError: (error: Error) => addToast(`فشل تحديث الملف: ${error.message}`, 'error')
    });

    const deleteChildProfile = useMutation({
        mutationFn: (payload: { childId: number }) => userService.deleteChildProfile(payload.childId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['userAccountData'] });
            queryClient.invalidateQueries({ queryKey: ['adminAllChildProfiles'] });
            addToast('تم حذف ملف الطفل بنجاح.', 'info');
        },
        onError: (error: Error) => {
            if (error.message.includes('violates foreign key constraint')) {
                addToast('عذراً، لا يمكن حذف الطفل لوجود حجوزات أو طلبات مرتبطة به. يرجى حذفها أولاً أو تنفيذ أوامر SQL الخاصة بالحذف التلقائي.', 'error');
            } else {
                addToast(`فشل حذف الملف: ${error.message}`, 'error');
            }
        }
    });

    // Student account linking (admin & parent)
    const createAndLinkStudentAccount = useMutation({
        mutationFn: userService.createAndLinkStudentAccount,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
            queryClient.invalidateQueries({ queryKey: ['adminAllChildProfiles'] });
            queryClient.invalidateQueries({ queryKey: ['userAccountData'] });
            addToast('تم إنشاء وربط حساب الطالب بنجاح.', 'success');
        },
        onError: (error: Error) => addToast(`فشل إنشاء الحساب: ${error.message}`, 'error')
    });
    
    const linkStudentToChildProfile = useMutation({
        mutationFn: userService.linkStudentToChildProfile,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
            queryClient.invalidateQueries({ queryKey: ['adminAllChildProfiles'] });
            addToast('تم ربط الحساب بنجاح.', 'success');
        },
        onError: (error: Error) => addToast(`فشل الربط: ${error.message}`, 'error'),
    });
    
    const unlinkStudentFromChildProfile = useMutation({
        mutationFn: (payload: { childProfileId: number }) => userService.unlinkStudentFromChildProfile(payload.childProfileId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
            queryClient.invalidateQueries({ queryKey: ['adminAllChildProfiles'] });
            addToast('تم إلغاء ربط الحساب بنجاح.', 'info');
        },
        onError: (error: Error) => addToast(`فشل إلغاء الربط: ${error.message}`, 'error'),
    });

    const resetStudentPassword = useMutation({
        mutationFn: userService.resetStudentPassword,
        onSuccess: () => {
            addToast('تم تغيير كلمة المرور بنجاح.', 'success');
        },
        onError: (error: Error) => addToast(`فشل تغيير كلمة المرور: ${error.message}`, 'error'),
    });

    // --- BULK ACTIONS ---
    const bulkDeleteUsers = useMutation({
        mutationFn: (payload: { userIds: string[] }) => userService.bulkDeleteUsers(payload.userIds),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
            queryClient.invalidateQueries({ queryKey: ['adminAllChildProfiles'] });
            queryClient.invalidateQueries({ queryKey: ['userAccountData'] }); // تحديث بيانات العميل فوراً
            addToast('تم حذف المستخدمين والبيانات المرتبطة بهم بنجاح.', 'info');
        },
        onError: (error: Error) => addToast(`فشل حذف المستخدمين: ${error.message}`, 'error'),
    });

    // --- PUBLISHER ---
    const updatePublisherProfile = useMutation({
        mutationFn: (payload: Partial<PublisherProfile> & { user_id: string }) => userService.updatePublisherProfile(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['publisherProfile'] });
            queryClient.invalidateQueries({ queryKey: ['publicData'] });
            addToast('تم تحديث ملف دار النشر بنجاح.', 'success');
        },
        onError: (error: Error) => addToast(`فشل تحديث ملف دار النشر: ${error.message}`, 'error'),
    });

    return { 
        createUser,
        updateUser, 
        updateUserPassword, 
        createChildProfile, 
        updateChildProfile, 
        deleteChildProfile, 
        createAndLinkStudentAccount, 
        linkStudentToChildProfile, 
        unlinkStudentFromChildProfile,
        resetStudentPassword,
        bulkDeleteUsers,
        updatePublisherProfile
    };
};
