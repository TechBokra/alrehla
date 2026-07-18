
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../contexts/AuthContext';
import { bookingService } from '../../../services/bookingService';
import { orderService } from '../../../services/orderService';
import { userService } from '../../../services/userService';
import { supabase } from '../../../lib/supabaseClient';
import type { 
    Instructor, 
    CreativeWritingBooking, 
    CreativeWritingPackage, 
    ScheduledSession, 
    ChildProfile, 
    SessionAttachment,
    InstructorPayout,
    ServiceOrder
} from '../../../lib/database.types';

export const useInstructorData = () => {
    const { currentUser } = useAuth();
    
    return useQuery({
        queryKey: ['instructorData', currentUser?.id],
        queryFn: async () => {
            if (!currentUser) return null;

            const currentInstructor = await bookingService.getInstructorByUserId(currentUser.id);
            if (!currentInstructor) return { instructor: null };

            const allInstructorBookings = await bookingService.getInstructorBookings(currentInstructor.id);
            const instructorBookings = allInstructorBookings.filter(b => b.status !== 'ملغي');
            const bookingIds = instructorBookings.map(b => b.id);
            const childIds = [...new Set(instructorBookings.map(b => b.child_id).filter(Boolean))];

            const [
                allPackages,
                allScheduledSessions,
                allChildren,
                instructorServiceOrders,
                instructorPayouts,
                instructorAttachments
            ] = await Promise.all([
                bookingService.getAllPackages(),
                bookingIds.length > 0
                    ? supabase.from('scheduled_sessions').select('*').in('booking_id', bookingIds).then(res => res.data as ScheduledSession[] || [])
                    : Promise.resolve([]),
                childIds.length > 0
                    ? supabase.from('child_profiles').select('*').in('id', childIds).then(res => res.data as ChildProfile[] || [])
                    : Promise.resolve([]),
                supabase.from('service_orders').select('*').eq('assigned_instructor_id', currentInstructor.id).then(res => res.data as ServiceOrder[] || []),
                supabase.from('instructor_payouts').select('*').eq('instructor_id', currentInstructor.id).then(res => res.data as InstructorPayout[] || []),
                bookingIds.length > 0
                    ? supabase.from('session_attachments').select('*').in('booking_id', bookingIds).then(res => res.data as SessionAttachment[] || [])
                    : Promise.resolve([])
            ]);

            // الفلترة: المدرب يرى الحجوزات (المؤكدة + بانتظار المراجعة + بانتظار الدفع)
            // الطلبات الملغية فقط هي التي تُستبعد

            const enrichedBookings = instructorBookings.map(booking => {
                const journeySessions = allScheduledSessions.filter(s => s.booking_id === booking.id);
                const packageDetails = allPackages.find(p => p.name === booking.package_name);
                const child = allChildren.find(c => c.id === booking.child_id);
                
                return {
                    ...booking,
                    sessions: journeySessions,
                    packageDetails,
                    child_profiles: child ? { id: child.id, name: child.name, avatar_url: child.avatar_url } : null
                }
            });

            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            
            // احتساب الجلسات المكتملة فقط للإحصائيات
            const introSessionsThisMonth = enrichedBookings.filter(b => 
                b.package_name === 'الجلسة التعريفية' &&
                b.status === 'مكتمل' &&
                new Date(b.booking_date).getMonth() === currentMonth &&
                new Date(b.booking_date).getFullYear() === currentYear
            ).length;
            
            const instructorBookingIds = new Set(instructorBookings.map(b => b.id));
            const relevantAttachments = instructorAttachments.filter(att => instructorBookingIds.has(att.booking_id));

            return {
                instructor: currentInstructor,
                bookings: enrichedBookings,
                introSessionsThisMonth,
                payouts: instructorPayouts,
                serviceOrders: instructorServiceOrders.filter(o => o.status !== 'ملغي'),
                attachments: relevantAttachments,
            };
        },
        enabled: !!currentUser,
    });
};
