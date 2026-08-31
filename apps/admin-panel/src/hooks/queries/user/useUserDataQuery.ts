
import { useQuery } from '@tanstack/react-query';
import { getChildProfiles, getProfile } from '@alrehla/api-client/resources/auth';
import { listBookings, listScheduledSessions } from '@alrehla/api-client/resources/bookings';
import { useAuth } from '../../../contexts/AuthContext';
import { apiClient, supabase } from '../../../lib/supabaseClient';
import type { 
    Notification,
    Order, 
    Subscription, 
    CreativeWritingPackage, 
    ChildBadge, 
    Badge, 
    SessionAttachment,
    ScheduledSession,
    EnrichedBooking,
    EnrichedChildProfile
} from '../../../lib/database.types';

export type { SessionAttachment, EnrichedBooking, EnrichedChildProfile };

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

export interface UserAccountData {
    userOrders: Order[];
    userSubscriptions: Subscription[];
    userBookings: EnrichedBooking[];
    childBadges: ChildBadge[];
    allBadges: Badge[];
    attachments: SessionAttachment[];
    childProfiles: EnrichedChildProfile[];
}

export const useUserAccountData = () => {
    const { currentUser } = useAuth();
    
    return useQuery<UserAccountData>({
        queryKey: ['userAccountData', currentUser?.id],
        queryFn: async () => {
            // Return empty structure if no user
            if (!currentUser) return { 
                userOrders: [], 
                userSubscriptions: [], 
                userBookings: [], 
                childBadges: [], 
                allBadges: [], 
                attachments: [], 
                childProfiles: [] 
            };

            // 1. Fetch primary user data in parallel
            const [ordersRes, subsRes, bookingsResult, children, badgesRes, allBadgesRes] = await Promise.all([
                supabase.from('orders').select('*').eq('user_id', currentUser.id).order('order_date', { ascending: false }),
                supabase.from('subscriptions').select('*').eq('user_id', currentUser.id),
                listBookings(apiClient, { userId: currentUser.id, pageSize: 100 }),
                getChildProfiles(apiClient, currentUser.id),
                supabase.from('child_badges').select('*'),
                supabase.from('badges').select('*')
            ]);

            const rawBookings = bookingsResult.rows.map(booking => ({ ...booking, status: booking.databaseStatus })) as any[];
            let enrichedBookings: EnrichedBooking[] = [];
            let attachments: SessionAttachment[] = [];
            
            // --- Enrich Child Profiles with Student Emails ---
            let enrichedChildProfiles = children as EnrichedChildProfile[];
            const studentUserIds = enrichedChildProfiles
                .map(c => c.student_user_id)
                .filter(id => id !== null) as string[];

            if (studentUserIds.length > 0) {
                const students = (await Promise.all(
                    studentUserIds.map(profileId => getProfile(apiClient, profileId)),
                )).filter(Boolean);
                
                const emailMap = new Map<string, string>();
                students.forEach((s: any) => emailMap.set(s.id, s.email));

                enrichedChildProfiles = enrichedChildProfiles.map(child => ({
                    ...child,
                    student_email: child.student_user_id ? emailMap.get(child.student_user_id) : undefined
                }));
            }
            // ------------------------------------------------

            // 2. Fetch related booking data (Optimized: Filter by IDs)
            if (rawBookings.length > 0) {
                const bookingIds = rawBookings.map(b => b.id);
                
                try {
                    const [packagesRes, sessions, attachmentsRes] = await Promise.all([
                        supabase.from('creative_writing_packages').select('*'),
                        listScheduledSessions(apiClient, { bookingIds }),
                        supabase.from('session_attachments').select('*').in('booking_id', bookingIds).order('created_at', { ascending: false })
                    ]);

                    const packages = (packagesRes.data || []) as CreativeWritingPackage[];
                    attachments = (attachmentsRes.data || []) as SessionAttachment[];

                    enrichedBookings = rawBookings.map((b: any) => ({
                        ...b,
                        sessions: sessions.filter((s) => s.booking_id === b.id) || [],
                        packageDetails: packages.find((p) => p.name === b.package_name),
                        instructorName: b.instructors?.name || 'غير محدد',
                        child_profiles: b.child_profiles
                    }));
                } catch (e) {
                    console.error("Enrichment failed", e);
                }
            }

            return {
                userOrders: (ordersRes.data || []) as Order[],
                userSubscriptions: (subsRes.data || []) as Subscription[],
                userBookings: enrichedBookings,
                childBadges: (badgesRes.data || []) as ChildBadge[],
                allBadges: (allBadgesRes.data || []) as Badge[],
                attachments: attachments,
                childProfiles: enrichedChildProfiles
            };
        },
        enabled: !!currentUser,
        staleTime: 1000 * 60 * 2, // 2 minutes cache
    });
};
