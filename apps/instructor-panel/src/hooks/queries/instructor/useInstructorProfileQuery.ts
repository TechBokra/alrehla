import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { bookingService } from '../../../services/bookingService';
import { instructorKeys } from './instructorKeys';
import type { Instructor } from '../../../lib/database.types';

export const useInstructorProfileQuery = (userId?: string) => {
  const { userId: clerkUserId } = useAuth();
  const effectiveUserId = userId || clerkUserId || undefined;

  return useQuery<Instructor | null>({
    queryKey: instructorKeys.profile(effectiveUserId),
    queryFn: async () => {
      if (!effectiveUserId) return null;
      return bookingService.getInstructorByUserId(effectiveUserId);
    },
    enabled: Boolean(effectiveUserId),
  });
};
