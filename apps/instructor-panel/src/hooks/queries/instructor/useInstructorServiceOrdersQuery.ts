import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabaseClient';
import { instructorKeys } from './instructorKeys';
import type { ServiceOrder } from '../../../lib/database.types';

export const useInstructorServiceOrdersQuery = (instructorId?: number | null) => {
  return useQuery<ServiceOrder[]>({
    queryKey: instructorKeys.serviceOrdersByInstructor(instructorId ?? undefined),
    queryFn: async () => {
      if (!instructorId) return [];

      const { data, error } = await supabase
        .from('service_orders')
        .select('*')
        .eq('assigned_instructor_id', instructorId);

      if (error) {
        console.error('Error fetching instructor service orders:', error);
        throw new Error('تعذر تحميل طلبات خدمات المدرب.');
      }

      return ((data as ServiceOrder[]) || []).filter(o => o.status !== 'ملغي');
    },
    enabled: Boolean(instructorId),
  });
};
