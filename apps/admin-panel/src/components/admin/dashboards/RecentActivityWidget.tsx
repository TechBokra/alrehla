import React, { useMemo } from 'react';
import Link from 'next/link';
import { ShoppingBag, BookOpen, UserPlus, MessageSquare, Clock } from 'lucide-react';
import AdminSection from '../AdminSection';

const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return `منذ ${Math.floor(interval)} سنوات`;
    interval = seconds / 2592000;
    if (interval > 1) return `منذ ${Math.floor(interval)} أشهر`;
    interval = seconds / 86400;
    if (interval > 1) return `منذ ${Math.floor(interval)} أيام`;
    interval = seconds / 3600;
    if (interval > 1) return `منذ ${Math.floor(interval)} ساعات`;
    interval = seconds / 60;
    if (interval > 1) return `منذ ${Math.floor(interval)} دقائق`;
    return 'الآن';
};

const activityConfig = {
    order: { icon: <ShoppingBag size={20} className="text-pink-500" />, link: '/orders', actionText: 'عرض الطلب' },
    booking: { icon: <BookOpen size={20} className="text-purple-500" />, link: '/creative-writing', actionText: 'عرض الحجز' },
    user: { icon: <UserPlus size={20} className="text-blue-500" />, link: '/users', actionText: 'عرض المستخدم' },
    ticket: { icon: <MessageSquare size={20} className="text-cyan-500" />, link: '/support', actionText: 'عرض الرسالة' }
};

const RecentActivityWidget = React.forwardRef<HTMLElement, { data: any } & React.HTMLAttributes<HTMLElement>>(
    ({ data, ...props }, ref) => {

    const recentActivities = useMemo(() => {
        const { orders = [], bookings = [], users = [], supportTickets = [] } = data || {};

        const allActivities = [
            ...orders.map((o: any) => ({
                id: o.id,
                type: 'order',
                date: o.order_date,
                text: `طلب جديد #${o.id.substring(0, 6)} من ${o.users?.name || 'مستخدم'}`
            })),
            ...bookings.map((b: any) => ({
                id: b.id,
                type: 'booking',
                date: b.created_at,
                text: `حجز جديد لـ ${b.child_profiles?.name || 'طالب'}`
            })),
            ...users.map((u: any) => ({
                id: u.id,
                type: 'user',
                date: u.created_at,
                text: `مستخدم جديد سجل: ${u.name}`
            })),
            ...supportTickets.map((t: any) => ({
                id: t.id,
                type: 'ticket',
                date: t.created_at,
                text: `رسالة دعم جديدة من ${t.name}`
            }))
        ];

        return allActivities
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);
    }, [data]);

    return (
        <AdminSection ref={ref} title="أحدث الأنشطة" icon={<Clock className="text-gray-500" />} {...props}>
            {recentActivities.length > 0 ? (
                <div className="flow-root">
                    <ul role="list" className="-mb-8">
                        {recentActivities.map((activity, activityIdx) => {
                            const config = activityConfig[activity.type as keyof typeof activityConfig];
                            return (
                                <li key={activity.id}>
                                    <div className="relative pb-8">
                                        {activityIdx !== recentActivities.length - 1 ? (
                                            <span className="absolute top-4 right-4 -mr-px h-full w-0.5 bg-gray-200 rtl:right-auto rtl:left-4 rtl:-ml-px" aria-hidden="true" />
                                        ) : null}
                                        <div className="relative flex space-x-3 rtl:space-x-reverse items-start">
                                            <div>
                                                <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center ring-8 ring-white">
                                                    {config.icon}
                                                </span>
                                            </div>
                                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4 rtl:space-x-reverse">
                                                <div>
                                                    <p className="text-sm text-gray-700">{activity.text}</p>
                                                    <p className="text-xs text-gray-500">{formatTimeAgo(activity.date)}</p>
                                                </div>
                                                <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                                    <Link href={config.link} className="font-medium text-blue-600 hover:text-blue-800">
                                                        {config.actionText}
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            ) : (
                <p className="text-center text-gray-500 py-8">لا توجد أنشطة حديثة.</p>
            )}
        </AdminSection>
    );
});
RecentActivityWidget.displayName = "RecentActivityWidget";

export default RecentActivityWidget;
