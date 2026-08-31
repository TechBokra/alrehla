import { useQuery } from '@tanstack/react-query';
import { bookingKeys } from '@alrehla/api-client/query-keys';
import { listBookings } from '@alrehla/api-client/resources/bookings';
import { apiClient } from '../../../lib/supabaseClient';
import type { CreativeWritingBooking } from '../../../lib/database.types';

export const useInstructorBookingsQuery = (instructorId?: number | null) => {
  return useQuery<CreativeWritingBooking[]>({
    queryKey: bookingKeys.list({ instructorId: instructorId ?? undefined }),
    queryFn: async () => {
      if (!instructorId) return [];
      const result = await listBookings(apiClient, { instructorId, pageSize: 100 });
      return result.rows
        .map(booking => ({ ...booking, status: booking.databaseStatus }) as CreativeWritingBooking)
        .filter(booking => booking.status !== 'ملغي');
    },
    enabled: Boolean(instructorId),
  });
};
