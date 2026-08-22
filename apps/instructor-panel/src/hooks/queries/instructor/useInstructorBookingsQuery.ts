import { useQuery } from '@tanstack/react-query';
import { bookingService } from '../../../services/bookingService';
import { instructorKeys } from './instructorKeys';
import type { CreativeWritingBooking } from '../../../lib/database.types';

export const useInstructorBookingsQuery = (instructorId?: number | null) => {
  return useQuery<CreativeWritingBooking[]>({
    queryKey: instructorKeys.bookingsByInstructor(instructorId ?? undefined),
    queryFn: async () => {
      if (!instructorId) return [];
      const allInstructorBookings = await bookingService.getInstructorBookings(instructorId);
      return (allInstructorBookings || []).filter(b => b.status !== 'ملغي');
    },
    enabled: Boolean(instructorId),
  });
};
