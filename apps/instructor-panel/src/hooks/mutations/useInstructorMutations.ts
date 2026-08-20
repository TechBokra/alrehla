import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../contexts/ToastContext';
import { bookingService } from '../../services/bookingService';
import { supabase } from '../../lib/supabaseClient';
import { communicationService } from '../../services/communicationService';
import type { WeeklySchedule, AvailableSlots } from '../../lib/database.types';

export const useInstructorMutations = () => {
    const queryClient = useQueryClient();
    const { addToast } = useToast();

    // 1. Schedule Management
    const requestScheduleChange = useMutation({
        mutationFn: async ({ instructorId, schedule }: { instructorId: number, schedule: WeeklySchedule }) => {
             const { error } = await (supabase.from('instructors') as any)
                .update({ 
                    schedule_status: 'pending',
                    pending_profile_data: { proposed_schedule: schedule, requested_at: new Date().toISOString() } 
                })
                .eq('id', instructorId);
             if(error) throw new Error(error.message);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['instructorData'] });
            addToast('تم إرسال طلب تحديث الجدول للمراجعة.', 'success');
        },
        onError: (err: Error) => addToast(`فشل إرسال الطلب: ${err.message}`, 'error')
    });

    // 2. Availability (One-off / Intro)
    const updateInstructorAvailability = useMutation({
         mutationFn: async ({ instructorId, availability }: { instructorId: number, availability: AvailableSlots }) => {
             const { error } = await (supabase.from('instructors') as any)
                .update({ availability })
                .eq('id', instructorId);
             if(error) throw new Error(error.message);
         },
         onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ['instructorData'] });
             addToast('تم تحديث التوافر.', 'success');
         },
         onError: (err: Error) => addToast(`فشل التحديث: ${err.message}`, 'error')
    });

    const requestIntroAvailabilityChange = useMutation({
        mutationFn: async ({ instructorId, availability }: { instructorId: number, availability: AvailableSlots }) => {
             const { error } = await (supabase.from('instructors') as any)
                .update({ intro_availability: availability })
                .eq('id', instructorId);
             if(error) throw new Error(error.message);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['instructorData'] });
            addToast('تم تحديث مواعيد الجلسات التعريفية.', 'success');
        },
        onError: (err: Error) => addToast(`فشل التحديث: ${err.message}`, 'error')
    });

    // 3. Profile & Pricing Updates
    const requestProfileUpdate = useMutation({
        mutationFn: async ({ instructorId, updates, justification }: { instructorId: number, updates: any, justification: string }) => {
             const { error } = await (supabase.from('instructors') as any)
                .update({ 
                    profile_update_status: 'pending',
                    pending_profile_data: { updates, justification, requested_at: new Date().toISOString() } 
                })
                .eq('id', instructorId);
             if(error) throw new Error(error.message);
        },
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ['instructorData'] });
             addToast('تم إرسال طلب تحديث الملف/الأسعار.', 'success');
        },
        onError: (err: Error) => addToast(`فشل الإرسال: ${err.message}`, 'error')
    });

    // 4. Session Requests (Reschedule / Support)
    const submitRescheduleRequest = useMutation({
        mutationFn: bookingService.submitRescheduleRequest,
        onSuccess: () => {
             addToast('تم إرسال طلب تغيير الموعد.', 'success');
        },
        onError: (err: Error) => addToast(`فشل الإرسال: ${err.message}`, 'error')
    });

    const createSupportSessionRequest = useMutation({
         mutationFn: async (payload: any) => {
             const { error } = await (supabase.from('support_session_requests') as any).insert([{...payload, status: 'pending', requested_at: new Date().toISOString()}]);
             if(error) throw new Error(error.message);
         },
         onSuccess: () => {
             addToast('تم إرسال طلب جلسة دعم.', 'success');
         },
         onError: (err: Error) => addToast(`فشل الإرسال: ${err.message}`, 'error')
    });

    return { 
        requestScheduleChange,
        updateInstructorAvailability,
        requestIntroAvailabilityChange,
        requestProfileUpdate,
        submitRescheduleRequest,
        createSupportSessionRequest
    };
};
