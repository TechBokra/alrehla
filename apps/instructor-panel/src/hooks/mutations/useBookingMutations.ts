import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../contexts/ToastContext';
import { bookingService } from '../../services/bookingService';
import { instructorKeys } from '../queries/instructor/instructorKeys';
import { sessionDetailsKey } from '../queries/user/useJourneyDataQuery';
import type { BookingStatus } from '../../lib/database.types';

export const useBookingMutations = () => {
    const queryClient = useQueryClient();
    const { addToast } = useToast();

    const createBooking = useMutation({
        mutationFn: bookingService.createBooking,
        // Kept for the shared mutation hook API; no current Instructor-panel caller uses it.
         onError: (error: Error) => {
            addToast(`فشل إنشاء الحجز: ${error.message}`, 'error');
        }
    });
    
    const updateBookingStatus = useMutation({
        mutationFn: (payload: { bookingId: string, newStatus: BookingStatus }) => bookingService.updateBookingStatus(payload.bookingId, payload.newStatus),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: instructorKeys.bookings() });
            addToast('تم تحديث حالة الحجز.', 'success');
        },
         onError: (error: Error) => {
            addToast(`فشل تحديث الحالة: ${error.message}`, 'error');
        }
    });

    const updateBookingProgressNotes = useMutation({
        mutationFn: (payload: { bookingId: string, notes: string }) => bookingService.updateBookingProgressNotes(payload.bookingId, payload.notes),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: instructorKeys.bookings() });
            queryClient.invalidateQueries({ queryKey: ['trainingJourney', variables.bookingId] });
            addToast('تم حفظ ملاحظات التقدم بنجاح.', 'success');
        },
         onError: (error: Error) => {
            addToast(`فشل حفظ الملاحظات: ${error.message}`, 'error');
        }
    });

    const updateScheduledSession = useMutation({
        mutationFn: (payload: { sessionId: string, updates: any }) => bookingService.updateScheduledSession(payload.sessionId, payload.updates),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: sessionDetailsKey(variables.sessionId) });
            queryClient.invalidateQueries({ queryKey: instructorKeys.sessions() });
        },
        onError: (error: Error) => {
            addToast(`فشل تحديث الجلسة: ${error.message}`, 'error');
        }
    });
    
    const updateBookingDraft = useMutation({
        mutationFn: (payload: { bookingId: string, draft: string }) => bookingService.saveBookingDraft(payload.bookingId, payload.draft),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['trainingJourney', variables.bookingId] });
            queryClient.invalidateQueries({ queryKey: instructorKeys.bookings() });
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
