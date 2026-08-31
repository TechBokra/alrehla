
import { useQuery } from '@tanstack/react-query';
import { bookingKeys } from '@alrehla/api-client/query-keys';
import { getBookingAvailability } from '@alrehla/api-client/resources/bookings';
import { publicService } from '../../../services/publicService';
import { apiClient } from '../../../lib/supabase/client';
import type { PersonalizedProduct } from '@alrehla/types';

export const useBookingData = () => {
    return useQuery({
        queryKey: bookingKeys.availability(),
        queryFn: async () => {
            const [data, bookingsResult] = await Promise.all([
                publicService.getCreativeWritingData(),
                getBookingAvailability(apiClient)
            ]);
            
            return {
                instructors: data.instructors,
                cw_packages: data.creativeWritingPackages,
                holidays: data.publicHolidays,
                cw_services: data.standaloneServices,
                pricingConfig: data.pricingSettings,
                activeBookings: bookingsResult.bookings
            };
        },
        staleTime: 1000 * 30,
        // Availability is genuinely live browser data; staleTime alone does
        // not schedule a refresh.
        refetchInterval: 1000 * 30,
    });
};

export type OrderData = {
    personalizedProducts: PersonalizedProduct[];
};

export const useOrderData = (initialData?: OrderData) => {
    return useQuery({
        queryKey: ['enhaLakOrderData'],
        queryFn: async () => {
            const personalizedProducts = await publicService.getPersonalizedProducts();
            return {
                personalizedProducts,
            };
        },
        initialData,
        staleTime: 1000 * 60 * 5,
    });
};
