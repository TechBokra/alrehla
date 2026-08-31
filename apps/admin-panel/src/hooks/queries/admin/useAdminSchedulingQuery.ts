
import { useQuery } from '@tanstack/react-query';
import { bookingKeys } from '@alrehla/api-client/query-keys';
import { listBookings, listScheduledSessions } from '@alrehla/api-client/resources/bookings';
import { bookingService } from '../../../services/bookingService';
import { userService } from '../../../services/userService';
import { orderService } from '../../../services/orderService';
import type { ScheduledSession } from '../../../lib/database.types';
import { apiClient } from '../../../lib/supabaseClient';

export const useAdminScheduledSessions = () => useQuery({
    queryKey: bookingKeys.sessions(),
    queryFn: async () => {
        const [sessions, instructors, children, bookingsResult, subscriptions] = await Promise.all([
            listScheduledSessions(apiClient),
            bookingService.getAllInstructors(),
            userService.getAllChildProfiles(),
            listBookings(apiClient, { pageSize: 100 }),
            orderService.getAllSubscriptions()
        ]);

        const bookings = bookingsResult.rows.map(booking => ({
            ...booking,
            status: booking.databaseStatus,
        }));

        return sessions
            .map(session => {
                const booking = bookings.find(b => b.id === session.booking_id);
                const subscription = subscriptions.find(s => s.id === session.subscription_id);
                
                // تحديد الحالة: إذا لم يوجد حجز (باقة)، نتحقق من حالة الاشتراك
                const status = booking?.status || (subscription ? 'نشط' : 'unknown');

                return {
                    ...session,
                    instructor_name: instructors.find(i => i.id === session.instructor_id)?.name || 'غير محدد',
                    child_name: children.find(c => c.id === session.child_id)?.name || 'غير محدد',
                    type: session.subscription_id ? 'اشتراك' : 'حجز باقة',
                    package_name: booking?.package_name || (subscription ? 'صندوق الرحلة' : 'خدمة إضافية'),
                    booking_status: status
                };
            })
            // تصفية الجلسات المرتبطة بحجوزات ملغية فقط
            .filter(session => session.booking_status !== 'ملغي');
    },
});
