import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabaseClient';
import { instructorKeys } from './instructorKeys';
import type { InstructorPayout } from '../../../lib/database.types';

export const useInstructorPayoutsQuery = (instructorId?: number | null) => {
  return useQuery<InstructorPayout[]>({
    queryKey: instructorKeys.payoutsByInstructor(instructorId ?? undefined),
    queryFn: async () => {
      if (!instructorId) return [];

      const { data, error } = await supabase
        .from('instructor_payouts')
        .select('*')
        .eq('instructor_id', instructorId);

      if (error) {
        console.error('Error fetching instructor payouts:', error);
        throw new Error('تعذر تحميل مدفوعات المدرب.');
      }

      return (data || []) as InstructorPayout[];
    },
    enabled: Boolean(instructorId),
  });
};
