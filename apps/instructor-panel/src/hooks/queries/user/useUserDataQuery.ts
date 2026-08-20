import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabaseClient';
import type { Notification } from '../../../lib/database.types';

export const useUserNotifications = () => {
    const { currentUser } = useAuth();
    return useQuery<Notification[]>({
        queryKey: ['userNotifications', currentUser?.id],
        queryFn: async () => {
            if (!currentUser) return [];
            const { data } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false });
            return (data as Notification[]) || [];
        },
        enabled: !!currentUser,
    });
};
