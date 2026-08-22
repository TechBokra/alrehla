import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabaseClient';
import { instructorKeys } from './instructorKeys';
import type { ScheduledSession } from '../../../lib/database.types';

export interface UseInstructorSessionsOptions {
  instructorId?: number | null;
  bookingIds?: string[];
}

export const useInstructorSessionsQuery = ({
  instructorId,
  bookingIds = [],
}: UseInstructorSessionsOptions) => {
  const hasBookings = Boolean(instructorId) && bookingIds.length > 0;

  return useQuery<ScheduledSession[]>({
    queryKey: instructorKeys.sessionsByBookings(instructorId || '', bookingIds),
    queryFn: async () => {
      if (!instructorId || bookingIds.length === 0) return [];

      const { data, error } = await supabase
        .from('scheduled_sessions')
        .select('*')
        .in('booking_id', bookingIds);

      if (error) {
        console.error('Error fetching instructor scheduled sessions:', error);
        throw new Error('تعذر تحميل جلسات المدرب.');
      }

      return (data || []) as ScheduledSession[];
    },
    enabled: hasBookings,
  });
};
