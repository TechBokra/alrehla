import { useQuery } from '@tanstack/react-query';
import { bookingKeys, sessionKeys } from '@alrehla/api-client/query-keys';
import { getBooking, listScheduledSessions } from '@alrehla/api-client/resources/bookings';
import { apiClient, supabase } from '../../../lib/supabaseClient';
import type { 
    ScheduledSession, 
    SessionMessage, 
    SessionAttachment, 
    CreativeWritingPackage,
    Instructor
} from '../../../lib/database.types';

export const sessionDetailsKey = (sessionId: string | undefined) =>
    sessionKeys.detail(sessionId || 'missing');

export const useSessionDetails = (sessionId: string | undefined) => {
    return useQuery({
        queryKey: sessionDetailsKey(sessionId),
        queryFn: async () => {
            if (!sessionId) return null;
            return (await listScheduledSessions(apiClient, { sessionId }))[0] || null;
        },
        enabled: !!sessionId,
    });
};

export const useTrainingJourneyData = (journeyId: string | undefined) => {
    return useQuery({
        queryKey: bookingKeys.detail(journeyId || 'missing'),
        queryFn: async () => {
            if (!journeyId) return null;
            
            const booking = await getBooking(apiClient, journeyId);
            if (!booking) throw new Error("Journey not found");

            const safeBooking = { ...booking, status: booking.databaseStatus } as any;

            const [scheduledSessions, messagesRes, attachmentsRes, packagesRes] = await Promise.all([
                listScheduledSessions(apiClient, { bookingId: journeyId }),
                supabase.from('session_messages').select('*').eq('booking_id', journeyId).order('created_at', { ascending: true }),
                supabase.from('session_attachments').select('*').eq('booking_id', journeyId).order('created_at', { ascending: false }),
                supabase.from('creative_writing_packages').select('*').eq('name', safeBooking.package_name).maybeSingle()
            ]);

            return {
                booking: safeBooking,
                package: packagesRes.data as CreativeWritingPackage | null,
                instructor: safeBooking.instructors as Instructor,
                childProfile: safeBooking.child_profiles,
                scheduledSessions: scheduledSessions as ScheduledSession[],
                messages: (messagesRes.data || []) as SessionMessage[],
                attachments: (attachmentsRes.data || []) as SessionAttachment[]
            };
        },
        enabled: !!journeyId,
        refetchInterval: 5000, 
    });
};
