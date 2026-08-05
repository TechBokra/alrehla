import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

export const useNotificationMutations = () => {
    const queryClient = useQueryClient();
    const { addToast } = useToast();
    const { currentUser } = useAuth();

    const markNotificationAsRead = useMutation({
        mutationFn: async ({ notificationId }: { notificationId: string | number }) => {
            const { error } = await (supabase.from('notifications') as any)
                .update({ read: true })
                .eq('id', notificationId);
            if (error) throw error;
            return { success: true };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['userNotifications'] });
        },
    });

    const markAllNotificationsAsRead = useMutation({
        mutationFn: async () => {
            const userId = currentUser?.id;
            if (!userId) throw new Error("User not authenticated");
            
            const { error } = await (supabase.from('notifications') as any)
                .update({ read: true })
                .eq('user_id', userId);
            if (error) throw error;
            return { success: true };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['userNotifications'] });
            addToast('تم تحديد الكل كمقروء', 'success');
        },
    });
    
     const deleteNotification = useMutation({
        mutationFn: async ({ notificationId }: { notificationId: string | number }) => {
            const { error } = await (supabase.from('notifications') as any)
                .delete()
                .eq('id', notificationId);
            if (error) throw error;
            return { success: true };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['userNotifications'] });
            addToast('تم حذف الإشعار', 'info');
        },
    });

    return { markNotificationAsRead, markAllNotificationsAsRead, deleteNotification };
};
