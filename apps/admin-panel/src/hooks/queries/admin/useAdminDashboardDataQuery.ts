
import { useQueries } from '@tanstack/react-query';
import { listBookings, listScheduledSessions } from '@alrehla/api-client/resources/bookings';
import { apiClient, supabase } from '../../../lib/supabaseClient';
import { publicService } from '../../../services/publicService';

const queries = [
    { 
        key: 'users', 
        fn: () => supabase.from('profiles').select('id, name, role, created_at').order('created_at', { ascending: false }).then(res => res.data || [])
    },
    { 
        key: 'orders', 
        fn: () => supabase.from('orders').select('id, total, status, order_date, item_summary, users:profiles(name)').order('order_date', { ascending: false }).then(res => res.data || [])
    },
    { 
        key: 'bookings', 
        fn: () => listBookings(apiClient, { pageSize: 100 }).then(result =>
            result.rows.map(booking => ({ ...booking, status: booking.databaseStatus })),
        )
    },
    { 
        key: 'subscriptions', 
        fn: () => supabase.from('subscriptions').select('id, status').then(res => res.data || [])
    },
    { 
        key: 'supportTickets', 
        fn: () => supabase.from('support_tickets').select('id, name, subject, status, created_at').order('created_at', { ascending: false }).then(res => res.data || [])
    },
    { 
        key: 'joinRequests', 
        fn: () => supabase.from('join_requests').select('id, name, role, status, created_at').order('created_at', { ascending: false }).then(res => res.data || [])
    },
    { 
        key: 'blogPosts', 
        fn: () => publicService.getBlogPosts().then(posts => posts.map(p => ({ id: p.id, status: p.status, title: p.title })))
    },
    { 
        key: 'instructors', 
        fn: () => supabase.from('instructors').select('id, user_id, schedule_status, profile_update_status').then(res => res.data || [])
    },
    { 
        key: 'supportSessionRequests', 
        fn: () => supabase.from('support_session_requests').select('id, status, reason, requested_at').then(res => res.data || [])
    },
    { 
        key: 'scheduledSessions', 
        fn: () => listScheduledSessions(apiClient)
    },
    { 
        key: 'serviceOrders', 
        fn: () => supabase.from('service_orders').select('id, status, created_at').then(res => res.data || [])
    },
    { 
        key: 'attachments', 
        fn: () => supabase.from('session_attachments').select('id, booking_id, created_at, file_url').order('created_at', { ascending: false }).limit(10).then(res => res.data || [])
    },
];

export const useAdminDashboardData = () => {
    const results = useQueries({
        queries: queries.map(q => ({
            queryKey: ['adminDashboard', q.key],
            queryFn: q.fn,
        })),
    });

    const isLoading = results.some(result => result.isLoading);
    const errorResult = results.find(result => result.error);
    const error = errorResult?.error;

    const data = isLoading || error ? null : results.reduce((acc, result, index) => {
        const key = queries[index].key;
        acc[key] = result.data;
        return acc;
    }, {} as any);

    const refetch = () => {
        results.forEach(result => {
            result.refetch();
        });
    };

    return { data, isLoading, error, refetch };
};
