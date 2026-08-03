import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../contexts/ToastContext';
import { communicationService } from '../../services/communicationService';

export const useNotificationMutations = () => {
    const queryClient = useQueryClient();
    const { addToast } = useToast();

    const markNotificationAsRead = useMutation({
        mutationFn: ({ notificationId }: { notificationId: string | number }) =>
            communicationService.markNotificationAsRead(notificationId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['userNotifications'] });
        },
    });

    const markAllNotificationsAsRead = useMutation({
        mutationFn: communicationService.markAllNotificationsAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['userNotifications'] });
            addToast('تم تحديد الكل كمقروء', 'success');
        },
    });
    
     const deleteNotification = useMutation({
        mutationFn: ({ notificationId }: { notificationId: string | number }) =>
            communicationService.deleteNotification(notificationId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['userNotifications'] });
            addToast('تم حذف الإشعار', 'info');
        },
    });

    return { markNotificationAsRead, markAllNotificationsAsRead, deleteNotification };
};
