
import { useQuery } from '@tanstack/react-query';
import { bookingKeys } from '@alrehla/api-client/query-keys';
import { listBookings } from '@alrehla/api-client/resources/bookings';
import { orderService } from '../../../services/orderService';
import { bookingService } from '../../../services/bookingService';
import { apiClient, supabase } from '../../../lib/supabaseClient';

export const useAdminFinancialsQuery = () => {
    return useQuery({
        queryKey: [...bookingKeys.lists(), 'financials'],
        queryFn: async () => {
            // Fetch real data directly
            const [orders, bookings, subscriptions, serviceOrders, instructors, packagesResult, servicesResult] = await Promise.all([
                orderService.getAllOrders(),
                listBookings(apiClient, { pageSize: 100 }),
                orderService.getAllSubscriptions(),
                orderService.getAllServiceOrders(),
                bookingService.getAllInstructors(),
                supabase.from('creative_writing_packages').select('*'),
                supabase.from('standalone_services').select('*'),
            ]);

            const packages = packagesResult.data || [];
            const services = servicesResult.data || [];

            // Payouts fetch (Real DB table)
            const { data: payouts } = await supabase.from('instructor_payouts').select('*');

            return { 
                orders, 
                bookings: {
                    bookings: bookings.rows.map(booking => ({ ...booking, status: booking.databaseStatus })),
                    count: bookings.total || 0,
                },
                subscriptions, 
                payouts: payouts || [], 
                instructors, 
                serviceOrders, 
                packages, 
                services 
            };
        },
    });
};
