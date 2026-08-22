import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { supabase } from '../../../lib/supabaseClient';
import type { Notification } from '../../../lib/database.types';

export const useUserNotifications = () => {
    const { userId } = useAuth();
    return useQuery<Notification[]>({
        queryKey: ['userNotifications', userId],
        queryFn: async () => {
            if (!userId) return [];
            const { data } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
            return (data as Notification[]) || [];
        },
        enabled: Boolean(userId),
    });
};
