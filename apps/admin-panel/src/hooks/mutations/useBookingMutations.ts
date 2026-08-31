
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppMutation } from '@alrehla/mutations';
import { bookingKeys, sessionKeys } from '@alrehla/api-client/query-keys';
import {
    createBooking as createBookingResource,
    updateBookingStatus as updateBookingStatusResource,
} from '@alrehla/api-client/resources/bookings';
import { useToast } from '../../contexts/ToastContext';
import { bookingService } from '../../services/bookingService';
import type { BookingStatus } from '../../lib/database.types';
import { apiClient } from '../../lib/supabaseClient';

export const useBookingMutations = () => {
    const queryClient = useQueryClient();
    const { addToast } = useToast();

    const notifier = {
        success: (message: string) => addToast(message, 'success'),
        error: (message: string) => addToast(message, 'error'),
    };

    const createBooking = useAppMutation<any, any>({
        mutationKey: ['bookings', 'create'],
        mutationFn: (payload) => createBookingResource(apiClient, {
            userId: payload.userId,
            childProfileId: payload.payload.child.id,
            instructorId: payload.payload.instructor.id,
            packageName: payload.payload.package.name,
            bookingDate: payload.payload.dateTime.date,
            bookingTime: payload.payload.dateTime.time,
            receiptUrl: payload.receiptUrl || null,
            expectedTotal: payload.payload.total,
        }),
        invalidate: [bookingKeys.lists(), bookingKeys.availability()],
        notifier,
        errorMessage: 'فشل إنشاء الحجز.',
    });
    
    const updateBookingStatus = useAppMutation<any, { bookingId: string, newStatus: BookingStatus }>({
        mutationKey: ['bookings', 'update-status'],
        mutationFn: (payload) => updateBookingStatusResource(apiClient, payload.bookingId, payload.newStatus),
        invalidate: [bookingKeys.lists(), bookingKeys.availability(), bookingKeys.sessions()],
        notifier,
        successMessage: 'تم تحديث حالة الحجز.',
        errorMessage: 'فشل تحديث حالة الحجز.',
    });

    const updateBookingProgressNotes = useMutation({
        mutationFn: (payload: { bookingId: string, notes: string }) => bookingService.updateBookingProgressNotes(payload.bookingId, payload.notes),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
            queryClient.invalidateQueries({ queryKey: bookingKeys.detail(variables.bookingId) });
            addToast('تم حفظ ملاحظات التقدم بنجاح.', 'success');
        },
         onError: (error: Error) => {
            addToast(`فشل حفظ الملاحظات: ${error.message}`, 'error');
        }
    });

    // Added missing updateScheduledSession mutation for session reporting and rescheduling
    const updateScheduledSession = useMutation({
        mutationFn: (payload: { sessionId: string, updates: any }) => bookingService.updateScheduledSession(payload.sessionId, payload.updates),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: sessionKeys.detail(variables.sessionId) });
            queryClient.invalidateQueries({ queryKey: bookingKeys.sessions() });
            queryClient.invalidateQueries({ queryKey: ['instructorData'] });
        },
        onError: (error: Error) => {
            addToast(`فشل تحديث الجلسة: ${error.message}`, 'error');
        }
    });
    
    const updateBookingDraft = useMutation({
        mutationFn: (payload: { bookingId: string, draft: string }) => bookingService.saveBookingDraft(payload.bookingId, payload.draft),
        onSuccess: (_, variables) => {
            // تحديث بيانات الرحلة فوراً لتظهر المسودة عند الجميع (تحديث الكاش)
            queryClient.invalidateQueries({ queryKey: bookingKeys.detail(variables.bookingId) });
            // تحديث الاستعلامات الأخرى ذات الصلة لضمان التزامن
            queryClient.invalidateQueries({ queryKey: ['studentDashboardData'] });
            addToast('تم حفظ المسودة بنجاح.', 'success');
        },
        onError: (error: Error) => {
            if (error.message.includes('column') && error.message.includes('does not exist')) {
                 addToast(`فشل الحفظ: يرجى تنفيذ أمر SQL لإضافة عمود 'details'.`, 'error');
            } else {
                 addToast(`فشل حفظ المسودة: ${error.message}`, 'error');
            }
        }
    });

    const sendSessionMessage = useMutation({
        mutationFn: bookingService.sendSessionMessage,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: bookingKeys.detail(variables.bookingId) });
        },
        onError: (error: Error) => {
            addToast(`فشل إرسال الرسالة: ${error.message}`, 'error');
        }
    });

    const uploadSessionAttachment = useMutation({
        mutationFn: bookingService.uploadSessionAttachment,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: bookingKeys.detail(variables.bookingId) });
            addToast('تم رفع الملف بنجاح.', 'success');
        },
        onError: (error: Error) => {
            addToast(`فشل رفع الملف: ${error.message}`, 'error');
        }
    });

    return { 
        createBooking, 
        updateBookingStatus, 
        updateBookingProgressNotes, 
        updateBookingDraft,
        sendSessionMessage,
        uploadSessionAttachment,
        updateScheduledSession
    };
};
