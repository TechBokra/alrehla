
import { useQuery } from '@tanstack/react-query';
import { bookingKeys } from '@alrehla/api-client/query-keys';
import { getBookingAvailability } from '@alrehla/api-client/resources/bookings';
import { publicService } from '../../../services/publicService';
import { apiClient } from '../../../lib/supabaseClient';

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
        staleTime: 1000 * 30, // تحديث كل 30 ثانية لضمان دقة المواعيد
    });
};

export const useOrderData = () => {
    return useQuery({
        queryKey: ['enhaLakOrderData'],
        queryFn: async () => {
            const personalizedProducts = await publicService.getPersonalizedProducts();
            return {
                personalizedProducts,
            };
        },
        staleTime: 1000 * 60 * 5,
    });
};
