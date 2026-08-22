import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabaseClient';
import type { 
    ScheduledSession, 
    SessionMessage, 
    SessionAttachment, 
    CreativeWritingPackage,
    Instructor
} from '../../../lib/database.types';

export const sessionDetailsKey = (sessionId: string | undefined) => ['sessionDetails', sessionId] as const;

export const useSessionDetails = (sessionId: string | undefined) => {
    return useQuery({
        queryKey: sessionDetailsKey(sessionId),
        queryFn: async () => {
            if (!sessionId) return null;
            const { data } = await supabase
                .from('scheduled_sessions')
                .select('*, instructors(name), child_profiles(name)')
                .eq('id', sessionId)
                .single();
            return data;
        },
        enabled: !!sessionId,
    });
};

export const useTrainingJourneyData = (journeyId: string | undefined) => {
    return useQuery({
        queryKey: ['trainingJourney', journeyId],
        queryFn: async () => {
            if (!journeyId) return null;
            
            const { data: booking, error: bookingError } = await supabase
                .from('bookings')
                .select('*, instructors(*), child_profiles(*)')
                .eq('id', journeyId)
                .single();

            if (bookingError) throw bookingError;
            if (!booking) throw new Error("Journey not found");

            const safeBooking = booking as any;

            const [sessionsRes, messagesRes, attachmentsRes, packagesRes] = await Promise.all([
                supabase.from('scheduled_sessions').select('*').eq('booking_id', journeyId).order('session_date', { ascending: true }),
                supabase.from('session_messages').select('*').eq('booking_id', journeyId).order('created_at', { ascending: true }),
                supabase.from('session_attachments').select('*').eq('booking_id', journeyId).order('created_at', { ascending: false }),
                supabase.from('creative_writing_packages').select('*').eq('name', safeBooking.package_name).maybeSingle()
            ]);

            return {
                booking: safeBooking,
                package: packagesRes.data as CreativeWritingPackage | null,
                instructor: safeBooking.instructors as Instructor,
                childProfile: safeBooking.child_profiles,
                scheduledSessions: (sessionsRes.data || []) as ScheduledSession[],
                messages: (messagesRes.data || []) as SessionMessage[],
                attachments: (attachmentsRes.data || []) as SessionAttachment[]
            };
        },
        enabled: !!journeyId,
        refetchInterval: 5000, 
    });
};
