import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import StatCard from '../StatCard';
import { DollarSign, Users, ShoppingBag, Star } from 'lucide-react';

const createNavigate = (router: ReturnType<typeof useRouter>) => (
    href: string | number,
    options?: { replace?: boolean },
) => {
    if (typeof href === 'number') {
        router.back();
        return;
    }

    const target = href || '/';
    if (options?.replace) router.replace(target);
    else router.push(target);
};

interface StatsSummaryWidgetProps {
    data: any;
}

const StatsSummaryWidget: React.FC<StatsSummaryWidgetProps> = ({ data }) => {
    const router = useRouter();
    const navigate = createNavigate(router);
    const { users = [], orders = [], bookings = [], subscriptions = [] } = data || {};

    const stats = useMemo(() => {
        const totalRevenue = 
            orders.reduce((sum: number, order: any) => sum + (order.total || 0), 0) + 
            bookings.reduce((sum: number, booking: any) => sum + (booking.total || 0), 0);
        
        const totalUsers = users.length;
        const totalOrdersAndBookings = orders.length + bookings.length;
        const activeSubscriptions = subscriptions.filter((s: any) => s.status === 'active').length;
        
        return { totalRevenue, totalUsers, totalOrdersAndBookings, activeSubscriptions };
    }, [users, orders, bookings, subscriptions]);


    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">نظرة عامة</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="إجمالي الإيرادات" value={`${stats.totalRevenue} ج.م`} icon={<DollarSign className="h-4 w-4 text-muted-foreground" />} />
                <StatCard title="إجمالي المستخدمين" value={stats.totalUsers} icon={<Users className="h-4 w-4 text-muted-foreground" />} onClick={() => navigate('/users')} />
                <StatCard title="إجمالي الطلبات والحجوزات" value={stats.totalOrdersAndBookings} icon={<ShoppingBag className="h-4 w-4 text-muted-foreground" />} onClick={() => navigate('/orders')} />
                <StatCard title="الاشتراكات النشطة" value={stats.activeSubscriptions} icon={<Star className="h-4 w-4 text-muted-foreground" />} onClick={() => navigate('/subscriptions')} />
            </div>
        </div>
    );
};

export default StatsSummaryWidget;