
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { bookingKeys } from '@alrehla/api-client/query-keys';
import { listBookings, type BookingStatusInput } from '@alrehla/api-client/resources/bookings';
import { apiClient } from '../../../lib/supabaseClient';

interface UseAdminBookingsOptions {
    page?: number;
    pageSize?: number;
    search?: string;
    statusFilter?: string;
}

export const useAdminRawCwBookings = (options: UseAdminBookingsOptions = {}) => useQuery({
    queryKey: bookingKeys.list({ scope: 'admin', ...options }),
    queryFn: async () => {
        const result = await listBookings(apiClient, {
            page: options.page,
            pageSize: options.pageSize,
            search: options.search,
            status: options.statusFilter as BookingStatusInput | 'all' | 'active' | 'archived' | undefined,
        });
        return {
            bookings: result.rows.map(booking => ({ ...booking, status: booking.databaseStatus })),
            count: result.total || 0,
        };
    },
    placeholderData: keepPreviousData,
});
