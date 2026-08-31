import { useQuery } from '@tanstack/react-query';
import { sessionKeys } from '@alrehla/api-client/query-keys';
import { listScheduledSessions } from '@alrehla/api-client/resources/bookings';
import { apiClient } from '../../../lib/supabaseClient';
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
    queryKey: sessionKeys.list({
      instructorId: instructorId ?? undefined,
      bookingIds,
    }),
    queryFn: async () => {
      if (!instructorId || bookingIds.length === 0) return [];

      return listScheduledSessions(apiClient, { instructorId, bookingIds }) as Promise<ScheduledSession[]>;
    },
    enabled: hasBookings,
  });
};
