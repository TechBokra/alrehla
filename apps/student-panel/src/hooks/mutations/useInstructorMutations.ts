import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../contexts/ToastContext';
import { bookingService } from '../../services/bookingService';
import { supabase } from '../../lib/supabaseClient';
import { communicationService } from '../../services/communicationService';
import type { WeeklySchedule, AvailableSlots } from '../../lib/database.types';

export const useInstructorMutations = () => {
    const queryClient = useQueryClient();
    const { addToast } = useToast();

    // 1. Manage Instructors (CRUD)
    const createInstructor = useMutation({
    mutationFn: async (payload: any) => {
        const { avatarFile, ...data } = payload;
        let avatarUrl = null;

        // رفع الصورة إذا تم اختيار صورة
        if (avatarFile) {
            const { cloudinaryService } = await import('../../services/cloudinaryService');
            const asset = await cloudinaryService.uploadImage(avatarFile, 'instructors');
            avatarUrl = JSON.stringify(asset);
        }

        const { error } = await (supabase.from('instructors') as any).insert([{ ...data, avatar_url: avatarUrl }]);
        if (error) throw new Error(error.message);
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['adminInstructors'] });
        addToast('تم إضافة المدرب بنجاح.', 'success');
    },
    onError: (err: Error) => addToast(`فشل إضافة المدرب: ${err.message}`, 'error')
});

    const updateInstructor = useMutation({
    mutationFn: async (payload: any) => {
        const { id, avatarFile, ...data } = payload;
        let updates = { ...data };

        // رفع الصورة إذا تم اختيار صورة جديدة
        if (avatarFile) {
            const { cloudinaryService } = await import('../../services/cloudinaryService');
            const asset = await cloudinaryService.uploadImage(avatarFile, 'instructors');
            updates.avatar_url = JSON.stringify(asset);
        }

        const { error } = await (supabase.from('instructors') as any).update(updates).eq('id', id);
        if (error) throw new Error(error.message);
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['adminInstructors'] });
        addToast('تم تحديث بيانات المدرب.', 'success');
    },
    onError: (err: Error) => addToast(`فشل التحديث: ${err.message}`, 'error')
    });

    const deleteInstructor = useMutation({
        mutationFn: async ({ instructorId }: { instructorId: number }) => {
             const { error } = await (supabase.from('instructors') as any).update({ deleted_at: new Date().toISOString() }).eq('id', instructorId);
             if(error) throw new Error(error.message);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminInstructors'] });
            addToast('تم حذف المدرب (أرشفة).', 'info');
        },
        onError: (err: Error) => addToast(`فشل الحذف: ${err.message}`, 'error')
    });

    // 2. Schedule Management
    const requestScheduleChange = useMutation({
        mutationFn: async ({ instructorId, schedule }: { instructorId: number, schedule: WeeklySchedule }) => {
             // In a real app, this might update a pending_schedule column
             // For now, let's assume it updates pending_profile_data or schedule_status
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

    const approveInstructorSchedule = useMutation({
        mutationFn: async ({ instructorId }: { instructorId: number }) => {
             // Fetch pending data
             const { data } = await supabase.from('instructors').select('pending_profile_data').eq('id', instructorId).single();
             const schedule = (data as any)?.pending_profile_data?.proposed_schedule;
             if(!schedule) throw new Error("No pending schedule found");

             const { error } = await (supabase.from('instructors') as any)
                .update({ 
                    weekly_schedule: schedule,
                    schedule_status: 'approved',
                    pending_profile_data: null 
                })
                .eq('id', instructorId);
             if(error) throw new Error(error.message);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminInstructors'] });
            addToast('تم اعتماد الجدول الجديد.', 'success');
        },
        onError: (err: Error) => addToast(`فشل الاعتماد: ${err.message}`, 'error')
    });

    const rejectInstructorSchedule = useMutation({
        mutationFn: async ({ instructorId }: { instructorId: number }) => {
             const { error } = await (supabase.from('instructors') as any)
                .update({ 
                    schedule_status: 'rejected',
                    // potentially keep pending_profile_data for feedback reference or clear it
                    // pending_profile_data: null 
                })
                .eq('id', instructorId);
             if(error) throw new Error(error.message);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminInstructors'] });
            addToast('تم رفض الجدول.', 'info');
        },
        onError: (err: Error) => addToast(`فشل الرفض: ${err.message}`, 'error')
    });

    // 3. Availability (One-off / Intro)
    const updateInstructorAvailability = useMutation({
         mutationFn: async ({ instructorId, availability }: { instructorId: number, availability: AvailableSlots }) => {
             const { error } = await (supabase.from('instructors') as any)
                .update({ availability })
                .eq('id', instructorId);
             if(error) throw new Error(error.message);
         },
         onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ['adminInstructors'] });
             addToast('تم تحديث التوافر.', 'success');
         },
         onError: (err: Error) => addToast(`فشل التحديث: ${err.message}`, 'error')
    });

    const requestIntroAvailabilityChange = useMutation({
        mutationFn: async ({ instructorId, availability }: { instructorId: number, availability: AvailableSlots }) => {
             // Directly updating for simplicity or request flow like schedule
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

    // 4. Profile & Pricing Updates
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

    const approveInstructorProfileUpdate = useMutation({
         mutationFn: async ({ instructorId, modifiedUpdates }: { instructorId: number, modifiedUpdates?: any }) => {
             const { data } = await supabase.from('instructors').select('pending_profile_data').eq('id', instructorId).single();
             const updates = modifiedUpdates || (data as any)?.pending_profile_data?.updates;
             if(!updates) throw new Error("No pending updates found");

             const { error } = await (supabase.from('instructors') as any)
                .update({ 
                    ...updates,
                    profile_update_status: 'approved',
                    pending_profile_data: { ...((data as any)?.pending_profile_data || {}), admin_feedback: modifiedUpdates?.admin_feedback }
                })
                .eq('id', instructorId);
             if(error) throw new Error(error.message);
         },
         onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ['adminInstructors'] });
             addToast('تم اعتماد التحديثات.', 'success');
         },
         onError: (err: Error) => addToast(`فشل الاعتماد: ${err.message}`, 'error')
    });

    const rejectInstructorProfileUpdate = useMutation({
        mutationFn: async ({ instructorId, feedback }: { instructorId: number, feedback: string }) => {
            const { data } = await supabase.from('instructors').select('pending_profile_data').eq('id', instructorId).single();
            const currentPending = (data as any)?.pending_profile_data || {};
            
            const { error } = await (supabase.from('instructors') as any)
               .update({ 
                   profile_update_status: 'rejected',
                   pending_profile_data: { ...currentPending, admin_feedback: feedback }
               })
               .eq('id', instructorId);
            if(error) throw new Error(error.message);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminInstructors'] });
            addToast('تم رفض التحديث.', 'info');
        },
        onError: (err: Error) => addToast(`فشل الرفض: ${err.message}`, 'error')
    });

    // 5. Session Requests (Reschedule / Support)
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

    const approveSupportSessionRequest = useMutation({
        mutationFn: async ({ requestId }: { requestId: string }) => {
             const { error } = await (supabase.from('support_session_requests') as any).update({ status: 'approved' }).eq('id', requestId);
             if(error) throw new Error(error.message);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminSupportSessionRequests'] });
            addToast('تمت الموافقة على الطلب.', 'success');
        },
        onError: (err: Error) => addToast(`فشل العملية: ${err.message}`, 'error')
    });

    const rejectSupportSessionRequest = useMutation({
        mutationFn: async ({ requestId }: { requestId: string }) => {
             const { error } = await (supabase.from('support_session_requests') as any).update({ status: 'rejected' }).eq('id', requestId);
             if(error) throw new Error(error.message);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminSupportSessionRequests'] });
            addToast('تم رفض الطلب.', 'info');
        },
        onError: (err: Error) => addToast(`فشل العملية: ${err.message}`, 'error')
    });

    const approveRescheduleRequest = useMutation({
         mutationFn: async ({ requestId, sessionId, newDateTime }: { requestId: string, sessionId: string, newDateTime: string }) => {
             // 1. Update session
             const { error: sessionError } = await (supabase.from('scheduled_sessions') as any)
                .update({ session_date: newDateTime })
                .eq('id', sessionId);
             if(sessionError) throw new Error(sessionError.message);
             
             // 2. Mark request approved
             await (supabase.from('support_session_requests') as any).update({ status: 'approved' }).eq('id', requestId);
             
             // 3. Notify user (optional, can be done via communicationService)
             const { data: session } = await supabase.from('scheduled_sessions').select('child_id').eq('id', sessionId).single();
             if(session) {
                 const { data: child } = await supabase.from('child_profiles').select('user_id').eq('id', (session as any).child_id).single();
                 if(child) communicationService.sendNotification((child as any).user_id, 'تم تغيير موعد الجلسة بناءً على طلب المدرب.', `/session/${sessionId}`);
             }
         },
         onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ['adminScheduledSessions'] });
             queryClient.invalidateQueries({ queryKey: ['adminSupportSessionRequests'] });
             addToast('تم تغيير الموعد بنجاح.', 'success');
         },
         onError: (err: Error) => addToast(`فشل التغيير: ${err.message}`, 'error')
    });


    return { 
        createInstructor, updateInstructor, deleteInstructor,
        approveInstructorSchedule, rejectInstructorSchedule, updateInstructorAvailability, 
        requestScheduleChange, requestProfileUpdate, submitRescheduleRequest,
        approveInstructorProfileUpdate, rejectInstructorProfileUpdate,
        approveSupportSessionRequest, rejectSupportSessionRequest, approveRescheduleRequest,
        createSupportSessionRequest, requestIntroAvailabilityChange
    };
}
