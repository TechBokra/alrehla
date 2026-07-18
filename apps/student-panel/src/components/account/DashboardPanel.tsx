"use client";


import React, { useMemo } from 'react';
import { Link } from '@/lib/router-compat';
import { Calendar, ShoppingBag, Star, ArrowLeft, Video, BookOpen, Users, UserPlus } from 'lucide-react';
import { useUserAccountData } from '../../hooks/queries/user/useUserDataQuery';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../utils/helpers';
import type { Order, Subscription, CreativeWritingBooking } from '../../lib/database.types';
import { Card, CardHeader, CardTitle, CardContent } from '@alrehla/ui/card';
import { Button } from '@alrehla/ui/button';
import StatCard from '@alrehla/ui/stat-card';

type AccountTab = 'dashboard' | 'myLibrary' | 'portfolio' | 'familyCenter' | 'settings' | 'notifications';

interface DashboardPanelProps {
    onNavigateTab: (tab: AccountTab) => void;
}

const DashboardPanel: React.FC<DashboardPanelProps> = ({ onNavigateTab }) => {
    const { data } = useUserAccountData();
    const { isParent } = useAuth();
    const { userOrders: orders = [], userSubscriptions: subscriptions = [], userBookings: bookings = [] } = data || {};

    const unifiedItems = useMemo(() => {
        const allItems = [
            ...orders.map((o: Order) => ({ id: o.id, type: 'order' as const, date: o.order_date, summary: o.item_summary, total: o.total, status: o.status })),
            ...subscriptions.map((s: Subscription) => ({ id: s.id, type: 'subscription' as const, date: s.start_date, summary: `اشتراك: ${s.child_name}` })),
            ...bookings.map((b: CreativeWritingBooking) => ({ id: b.id, type: 'booking' as const, date: b.booking_date, summary: b.package_name }))
        ];
        return allItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [orders, subscriptions, bookings]);
    
    const upcomingSessions = useMemo(() => 
        bookings
            .filter((b: any) => b.status === 'مؤكد' && new Date(b.booking_date) >= new Date())
            .sort((a: any, b: any) => new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime()),
    [bookings]);

    const activeSubscriptions = useMemo(() => 
        subscriptions.filter((s: Subscription) => s.status === 'active'),
    [subscriptions]);
    
    const recentItems = unifiedItems.slice(0, 3);

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                    title="الطلبات والحجوزات" 
                    value={unifiedItems.length} 
                    icon={<ShoppingBag className="h-4 w-4 text-muted-foreground"/>} 
                    onClick={() => onNavigateTab('myLibrary')} 
                />
                <StatCard 
                    title="الاشتراكات النشطة" 
                    value={activeSubscriptions.length} 
                    icon={<Star className="h-4 w-4 text-muted-foreground"/>} 
                    onClick={() => onNavigateTab('myLibrary')} 
                />
                <StatCard 
                    title="الجلسات القادمة" 
                    value={upcomingSessions.length} 
                    icon={<Calendar className="h-4 w-4 text-muted-foreground"/>} 
                    onClick={() => onNavigateTab('myLibrary')} 
                />
            </div>

            {!isParent && (
                <Card className="bg-blue-50 border-blue-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3"><Users /> إدارة العائلة</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4">أضف ملفات أطفالك لتتمكن من طلب منتجات مخصصة لهم بسهولة ومتابعة رحلاتهم الإبداعية.</p>
                        <Button onClick={() => onNavigateTab('familyCenter')} icon={<UserPlus />}>
                            إضافة طفل الآن
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Upcoming Sessions */}
            <Card>
                <CardHeader>
                    <CardTitle>الجلسات القادمة</CardTitle>
                </CardHeader>
                <CardContent>
                    {upcomingSessions.length > 0 ? (
                        <div className="space-y-4">
                            {upcomingSessions.slice(0, 3).map((session: any) => (
                                <div key={session.id} className="p-4 bg-muted/50 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                                    <div>
                                        <p className="font-bold text-primary">{session.package_name}</p>
                                        <p className="text-sm text-muted-foreground">{formatDate(session.booking_date)} - {session.booking_time}</p>
                                    </div>
                                    <Link to={`/session/${session.session_id}`} className="flex items-center justify-center gap-2 bg-green-500 text-white text-sm font-bold py-2 px-4 rounded-full hover:bg-green-600 transition-colors">
                                        <Video size={16}/>
                                        <span>انضم الآن</span>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center py-4">لا توجد جلسات قادمة محجوزة.</p>
                    )}
                </CardContent>
            </Card>

             {/* Recent Activities */}
            <Card>
                 <CardHeader>
                    <CardTitle>أحدث الأنشطة</CardTitle>
                </CardHeader>
                <CardContent>
                    {recentItems.length > 0 ? (
                        <div className="space-y-3">
                            {recentItems.map(item => (
                                <div key={`${item.type}-${item.id}`} className="p-3 bg-muted/50 rounded-lg flex items-center gap-3">
                                    <div className="flex-shrink-0">
                                        {item.type === 'order' ? <ShoppingBag size={20} className="text-primary"/> : item.type === 'subscription' ? <Star size={20} className="text-orange-500"/> : <BookOpen size={20} className="text-purple-500" />}
                                    </div>
                                    <div className="flex-grow">
                                        <p className="font-semibold text-foreground text-sm">{item.summary}</p>
                                        <p className="text-xs text-muted-foreground">{formatDate(item.date)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center py-4">لا توجد أنشطة مسجلة بعد.</p>
                    )}
                    <div className="mt-4 text-center">
                        <button onClick={() => onNavigateTab('myLibrary')} className="text-sm font-semibold text-primary hover:underline flex items-center justify-center gap-1 mx-auto">
                            <span>عرض كل الطلبات</span>
                            <ArrowLeft size={16}/>
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default DashboardPanel;
