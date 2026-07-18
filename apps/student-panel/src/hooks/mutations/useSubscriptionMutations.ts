
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../contexts/ToastContext';
import { orderService } from '../../services/orderService';

export const useSubscriptionMutations = () => {
    const queryClient = useQueryClient();
    const { addToast } = useToast();

    const createSubscription = useMutation({
        mutationFn: orderService.createSubscription,
        onError: (error: Error) => {
            addToast(`فشل إنشاء الاشتراك: ${error.message}`, 'error');
        }
    });
    
    const pauseSubscription = useMutation({
        mutationFn: (payload: { subscriptionId: string }) => orderService.updateSubscriptionStatus(payload.subscriptionId, 'pause'),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminSubscriptions'] });
            addToast('تم إيقاف الاشتراك مؤقتاً.', 'success');
        },
        onError: (error: Error) => addToast(`فشل: ${error.message}`, 'error'),
    });

    const cancelSubscription = useMutation({
        mutationFn: (payload: { subscriptionId: string }) => orderService.updateSubscriptionStatus(payload.subscriptionId, 'cancel'),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminSubscriptions'] });
            addToast('تم إلغاء الاشتراك.', 'success');
        },
        onError: (error: Error) => addToast(`فشل: ${error.message}`, 'error'),
    });
    
    const reactivateSubscription = useMutation({
        mutationFn: (payload: { subscriptionId: string }) => orderService.updateSubscriptionStatus(payload.subscriptionId, 'reactivate'),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminSubscriptions'] });
            addToast('تم إعادة تفعيل الاشتراك.', 'success');
        },
        onError: (error: Error) => addToast(`فشل: ${error.message}`, 'error'),
    });

    // Mutations for Subscription Plans
    const createSubscriptionPlan = useMutation({
        mutationFn: orderService.createSubscriptionPlan,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminSubscriptionPlans'] });
            queryClient.invalidateQueries({ queryKey: ['publicData'] }); // تحديث الواجهة الأمامية
            addToast('تم إنشاء الباقة بنجاح.', 'success');
        },
        onError: (err: Error) => addToast(`فشل إنشاء الباقة: ${err.message}`, 'error'),
    });

    const updateSubscriptionPlan = useMutation({
        mutationFn: orderService.updateSubscriptionPlan,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminSubscriptionPlans'] });
            queryClient.invalidateQueries({ queryKey: ['publicData'] }); // تحديث الواجهة الأمامية
            addToast('تم تحديث الباقة بنجاح.', 'success');
        },
        onError: (err: Error) => addToast(`فشل تحديث الباقة: ${err.message}`, 'error'),
    });

    const deleteSubscriptionPlan = useMutation({
        mutationFn: (payload: { planId: number }) => orderService.deleteSubscriptionPlan(payload.planId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminSubscriptionPlans'] });
            queryClient.invalidateQueries({ queryKey: ['publicData'] }); // تحديث الواجهة الأمامية
            addToast('تم حذف الباقة بنجاح.', 'info');
        },
        onError: (err: Error) => addToast(`فشل حذف الباقة: ${err.message}`, 'error'),
    });


    return { 
        createSubscription, 
        pauseSubscription, 
        cancelSubscription, 
        reactivateSubscription,
        createSubscriptionPlan,
        updateSubscriptionPlan,
        deleteSubscriptionPlan
    };
};
