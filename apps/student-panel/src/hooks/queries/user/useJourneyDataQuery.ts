
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabaseClient';
import { authService } from '../../../services/authService';
import type { 
    ScheduledSession, 
    SessionMessage, 
    SessionAttachment, 
    CreativeWritingPackage,
    Instructor
} from '../../../lib/database.types';

export const useStudentDashboardData = () => {
    const { currentUser } = useAuth();
    
    return useQuery({
        queryKey: ['studentDashboardData', currentUser?.id],
        queryFn: async () => {
            if (!currentUser) return null;

            // 1. جلب ملف الطفل المرتبط بحساب الطالب من DB
            const childProfile = await authService.getStudentProfile(currentUser.id);

            if (!childProfile) {
                return { isUnlinked: true, journeys: [], orders: [], subscriptions: [], badges: [] };
            }

            const childId = childProfile.id;

            // 2. جلب اسم ولي الأمر الحقيقي
            const { data: parentData } = await supabase
                .from('profiles')
                .select('name')
                .eq('id', childProfile.user_id)
                .single();
            
            // Cast to any to avoid strict null checks if type definition is too strict
            const parentProfile = parentData as any;
            const parentName = parentProfile?.name || 'ولي أمر';

            // 3. جلب البيانات المرتبطة من الجداول الحقيقية فقط
            const [bookingsRes, ordersRes, subsRes, badgesRes, attachmentsRes, sessionsRes] = await Promise.all([
                supabase.from('bookings').select('*, instructors(name, id, avatar_url, specialty)').eq('child_id', childId),
                supabase.from('orders').select('*').eq('child_id', childId),
                supabase.from('subscriptions').select('*').eq('child_id', childId),
                supabase.from('child_badges').select('*, badges(*)').eq('child_id', childId),
                supabase.from('session_attachments').select('*').eq('uploader_id', currentUser.id),
                supabase.from('scheduled_sessions').select('*').eq('child_id', childId)
            ]);

            const allSessions = sessionsRes.data || [];

            return {
                parentName,
                isUnlinked: false,
                journeys: (bookingsRes.data || []).map((b: any) => ({ 
                    ...b, 
                    instructor_name: b.instructors?.name,
                    // نربط الجلسات بالحجز الخاص بها لتجنب الخطأ في الواجهة
                    sessions: allSessions.filter((s: any) => s.booking_id === b.id)
                })),
                orders: ordersRes.data || [],
                subscriptions: subsRes.data || [],
                badges: (badgesRes.data || []).map((cb: any) => cb.badges).filter(Boolean),
                attachments: attachmentsRes.data || [],
                childProfile
            };
        },
        enabled: !!currentUser,
    });
};

export const useSessionDetails = (sessionId: string | undefined) => {
    return useQuery({
        queryKey: ['sessionDetails', sessionId],
        queryFn: async () => {
            if (!sessionId) return null;
            // Updated: Added child_profiles(name) to the selection
            const { data } = await supabase
                .from('scheduled_sessions')
                .select('*, instructors(name), child_profiles(name)')
                .eq('id', sessionId)
                .single();
            return data;
        },
        enabled: !!sessionId,
    });
};

export const useTrainingJourneyData = (journeyId: string | undefined) => {
    return useQuery({
        queryKey: ['trainingJourney', journeyId],
        queryFn: async () => {
            if (!journeyId) return null;
            
            const { data: booking, error: bookingError } = await supabase
                .from('bookings')
                .select('*, instructors(*), child_profiles(*)')
                .eq('id', journeyId)
                .single();

            if (bookingError) throw bookingError;
            if (!booking) throw new Error("Journey not found");

            // Cast booking to any to safely access potentially joined properties
            const safeBooking = booking as any;

            const [sessionsRes, messagesRes, attachmentsRes, packagesRes] = await Promise.all([
                supabase.from('scheduled_sessions').select('*').eq('booking_id', journeyId).order('session_date', { ascending: true }),
                supabase.from('session_messages').select('*').eq('booking_id', journeyId).order('created_at', { ascending: true }),
                supabase.from('session_attachments').select('*').eq('booking_id', journeyId).order('created_at', { ascending: false }),
                supabase.from('creative_writing_packages').select('*').eq('name', safeBooking.package_name).maybeSingle()
            ]);

            return {
                booking: safeBooking,
                package: packagesRes.data as CreativeWritingPackage | null,
                instructor: safeBooking.instructors as Instructor,
                childProfile: safeBooking.child_profiles,
                // Explicitly cast empty arrays to prevent 'never[]' inference
                scheduledSessions: (sessionsRes.data || []) as ScheduledSession[],
                messages: (messagesRes.data || []) as SessionMessage[],
                attachments: (attachmentsRes.data || []) as SessionAttachment[]
            };
        },
        enabled: !!journeyId,
        refetchInterval: 5000, 
    });
};
