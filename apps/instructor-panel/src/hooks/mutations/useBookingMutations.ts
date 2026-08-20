import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../contexts/ToastContext';
import { bookingService } from '../../services/bookingService';
import type { BookingStatus } from '../../lib/database.types';

export const useBookingMutations = () => {
    const queryClient = useQueryClient();
    const { addToast } = useToast();

    const createBooking = useMutation({
        mutationFn: bookingService.createBooking,
         onError: (error: Error) => {
            addToast(`فشل إنشاء الحجز: ${error.message}`, 'error');
        }
    });
    
    const updateBookingStatus = useMutation({
        mutationFn: (payload: { bookingId: string, newStatus: BookingStatus }) => bookingService.updateBookingStatus(payload.bookingId, payload.newStatus),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['instructorData'] });
            addToast('تم تحديث حالة الحجز.', 'success');
        },
         onError: (error: Error) => {
            addToast(`فشل تحديث الحالة: ${error.message}`, 'error');
        }
    });

    const updateBookingProgressNotes = useMutation({
        mutationFn: (payload: { bookingId: string, notes: string }) => bookingService.updateBookingProgressNotes(payload.bookingId, payload.notes),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['instructorData'] });
            queryClient.invalidateQueries({ queryKey: ['trainingJourney', variables.bookingId] });
            addToast('تم حفظ ملاحظات التقدم بنجاح.', 'success');
        },
         onError: (error: Error) => {
            addToast(`فشل حفظ الملاحظات: ${error.message}`, 'error');
        }
    });

    const updateScheduledSession = useMutation({
        mutationFn: (payload: { sessionId: string, updates: any }) => bookingService.updateScheduledSession(payload.sessionId, payload.updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sessionDetails'] });
            queryClient.invalidateQueries({ queryKey: ['instructorData'] });
        },
        onError: (error: Error) => {
            addToast(`فشل تحديث الجلسة: ${error.message}`, 'error');
        }
    });
    
    const updateBookingDraft = useMutation({
        mutationFn: (payload: { bookingId: string, draft: string }) => bookingService.saveBookingDraft(payload.bookingId, payload.draft),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['trainingJourney', variables.bookingId] });
            queryClient.invalidateQueries({ queryKey: ['instructorData'] });
            addToast('تم حفظ المسودة بنجاح.', 'success');
        },
        onError: (error: Error) => {
            addToast(`فشل حفظ المسودة: ${error.message}`, 'error');
        }
    });

    return {
        createBooking,
        updateBookingStatus,
        updateBookingProgressNotes,
        updateScheduledSession,
        updateBookingDraft
    };
};
