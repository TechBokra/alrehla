import { useQuery } from '@tanstack/react-query';
import { bookingKeys, sessionKeys } from '@alrehla/api-client/query-keys';
import { getStudentProfileByProfileId } from '@alrehla/api-client/resources/auth';
import { getBooking, listBookings, listScheduledSessions } from '@alrehla/api-client/resources/bookings';
import { useAuth } from '../../../contexts/AuthContext';
import { apiClient, supabase } from '../../../lib/supabaseClient';
import type {
  CreativeWritingPackage,
  Instructor,
  ScheduledSession,
  SessionAttachment,
  SessionMessage,
} from '../../../lib/database.types';

export const useStudentDashboardData = () => {
  const { currentUser } = useAuth();
  return useQuery({
    queryKey: ['studentDashboardData', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return null;
      const childProfile = await getStudentProfileByProfileId(apiClient, currentUser.id);
      if (!childProfile) {
        return { isUnlinked: true, journeys: [], orders: [], subscriptions: [], badges: [] };
      }
      const childId = childProfile.id;
      const [bookingResult, ordersRes, subsRes, badgesRes, attachmentsRes, sessions] = await Promise.all([
        listBookings(apiClient, { childProfileId: childId, statuses: ['confirmed', 'completed'], pageSize: 100 }),
        supabase.from('orders').select('*').eq('child_id', childId),
        supabase.from('subscriptions').select('*').eq('child_id', childId),
        supabase.from('child_badges').select('*, badges(*)').eq('child_id', childId),
        supabase.from('session_attachments').select('*').eq('uploader_id', currentUser.id),
        listScheduledSessions(apiClient, { childProfileId: childId }),
      ]);
      return {
        parentName: childProfile.parentName || 'ولي أمر',
        isUnlinked: false,
        journeys: bookingResult.rows.map((booking) => ({
          ...booking,
          status: booking.databaseStatus,
          instructor_name: booking.instructors?.name,
          sessions: sessions.filter((session) => session.booking_id === booking.id),
        })),
        orders: ordersRes.data || [],
        subscriptions: subsRes.data || [],
        badges: (badgesRes.data || []).map((entry: any) => entry.badges).filter(Boolean),
        attachments: attachmentsRes.data || [],
        childProfile,
      };
    },
    enabled: Boolean(currentUser),
  });
};

export const useSessionDetails = (sessionId: string | undefined) => useQuery({
  queryKey: sessionKeys.detail(sessionId || 'missing'),
  queryFn: async () => sessionId
    ? (await listScheduledSessions(apiClient, { sessionId }))[0] || null
    : null,
  enabled: Boolean(sessionId),
});

export const useTrainingJourneyData = (journeyId: string | undefined) => useQuery({
  queryKey: bookingKeys.detail(journeyId || 'missing'),
  queryFn: async () => {
    if (!journeyId) return null;
    const booking = await getBooking(apiClient, journeyId);
    if (!booking || !['confirmed', 'completed'].includes(booking.status)) {
      throw new Error('Journey not found');
    }
    const safeBooking = { ...booking, status: booking.databaseStatus };
    const [scheduledSessions, messagesRes, attachmentsRes, packagesRes] = await Promise.all([
      listScheduledSessions(apiClient, { bookingId: journeyId }),
      supabase.from('session_messages').select('*').eq('booking_id', journeyId).order('created_at', { ascending: true }),
      supabase.from('session_attachments').select('*').eq('booking_id', journeyId).order('created_at', { ascending: false }),
      supabase.from('creative_writing_packages').select('*').eq('name', safeBooking.package_name).maybeSingle(),
    ]);
    return {
      booking: safeBooking,
      package: packagesRes.data as CreativeWritingPackage | null,
      instructor: safeBooking.instructors as Instructor,
      childProfile: safeBooking.child_profiles,
      scheduledSessions: scheduledSessions as ScheduledSession[],
      messages: (messagesRes.data || []) as SessionMessage[],
      attachments: (attachmentsRes.data || []) as SessionAttachment[],
    };
  },
  enabled: Boolean(journeyId),
  refetchInterval: 5000,
});
