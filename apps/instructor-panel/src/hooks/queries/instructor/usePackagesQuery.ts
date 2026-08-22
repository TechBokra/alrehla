import { useQuery } from '@tanstack/react-query';
import { bookingService } from '../../../services/bookingService';
import { instructorKeys } from './instructorKeys';
import type { CreativeWritingPackage } from '../../../lib/database.types';

export const usePackagesQuery = () => {
  return useQuery<CreativeWritingPackage[]>({
    queryKey: instructorKeys.packages(),
    queryFn: async () => {
      return bookingService.getAllPackages();
    },
  });
};
