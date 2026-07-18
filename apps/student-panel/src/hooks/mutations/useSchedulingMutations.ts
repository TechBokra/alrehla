import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../contexts/ToastContext';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const useSchedulingMutations = () => {
    const queryClient = useQueryClient();
    const { addToast } = useToast();

    const scheduleSubscriptionSessions = useMutation({
        mutationFn: async (payload: { subscriptionId: string, childId: number, schedule: any }) => {
            await sleep(800);
            console.log('Scheduling subscription sessions (mock)', payload);
            // In a real app, this would generate session records in the database.
            return { success: true };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminScheduledSessions'] });
            queryClient.invalidateQueries({ queryKey: ['adminDashboard', 'scheduledSessions'] }); // for dashboard widget
            addToast('تم جدولة الجلسات بنجاح.', 'success');
        },
        onError: (err: Error) => {
            addToast(`فشل جدولة الجلسات: ${err.message}`, 'error');
        }
    });

    const scheduleIntroductorySession = useMutation({
        mutationFn: async (payload: { instructorId: number, date: string, time: string }) => {
            await sleep(800);
            console.log('Scheduling introductory session (mock)', payload);
            // This would create a new booking and a new scheduled session in a real app.
            return { success: true };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminScheduledSessions'] });
            addToast('تم جدولة الجلسة التعريفية بنجاح.', 'success');
        },
        onError: (err: Error) => {
            addToast(`فشل جدولة الجلسة: ${err.message}`, 'error');
        }
    });

    return { scheduleSubscriptionSessions, scheduleIntroductorySession };
};