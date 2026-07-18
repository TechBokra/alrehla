"use client";


import React, { useState, useMemo } from 'react';
import { Link } from '@/lib/router-compat';
import { Bell, ShoppingBag, Calendar, Info, CheckCheck } from 'lucide-react';
import { useUserNotifications } from '../../hooks/queries/user/useUserDataQuery';
import { useNotificationMutations } from '../../hooks/mutations/useNotificationMutations';
import PageLoader from '@alrehla/ui/page-loader';
import { formatDate } from '../../utils/helpers';
import { Button } from '@alrehla/ui/button';

const NotificationIcon: React.FC<{ type: string }> = ({ type }) => {
    switch (type) {
        case 'order': return <ShoppingBag className="w-5 h-5 text-blue-500" />;
        case 'booking': return <Calendar className="w-5 h-5 text-purple-500" />;
        default: return <Info className="w-5 h-5 text-gray-500" />;
    }
};

const NotificationPanel: React.FC = () => {
    const { data: notifications = [], isLoading, error } = useUserNotifications();
    const { markNotificationAsRead, markAllNotificationsAsRead } = useNotificationMutations();
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    const filteredNotifications = useMemo(() => {
        if (filter === 'unread') {
            return notifications.filter((n: any) => !n.read);
        }
        return [...notifications].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }, [notifications, filter]);

    const handleNotificationClick = (notificationId: number) => {
        markNotificationAsRead.mutate({ notificationId });
    };

    if (isLoading) {
        return (
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg">
                <PageLoader text="جاري تحميل الإشعارات..." />
            </div>
        );
    }
    
    if (error) {
        return <div className="text-red-500">{error.message}</div>
    }

    return (
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg">
             <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Bell /> الإشعارات</h2>
                <div className="flex items-center gap-2 flex-wrap">
                    <Button variant={filter === 'all' ? 'default' : 'ghost'} size="sm" onClick={() => setFilter('all')}>الكل</Button>
                    <Button variant={filter === 'unread' ? 'default' : 'ghost'} size="sm" onClick={() => setFilter('unread')}>غير المقروءة</Button>
                    <Button variant="subtle" size="sm" onClick={() => markAllNotificationsAsRead.mutate()} icon={<CheckCheck size={16}/>} disabled={!notifications.some((n: any) => !n.read)}>
                        تحديد الكل كمقروء
                    </Button>
                </div>
            </div>

            {filteredNotifications && filteredNotifications.length > 0 ? (
                <div className="space-y-4">
                    {filteredNotifications.map((notif: any) => (
                        <Link 
                            key={notif.id} 
                            to={notif.link}
                            state={notif.link === '/account' ? { defaultTab: 'familyCenter' } : undefined}
                            onClick={() => handleNotificationClick(notif.id)}
                            className={`block p-4 rounded-lg border-r-4 transition-colors ${notif.read ? 'bg-gray-50 border-gray-200 hover:bg-gray-100' : 'bg-blue-50 border-blue-400 hover:bg-blue-100'}`}
                        >
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 mt-1">
                                    <NotificationIcon type={notif.type} />
                                </div>
                                <div className="flex-grow">
                                    <p className={`text-gray-800 ${!notif.read && 'font-semibold'}`}>{notif.message}</p>
                                    <p className="text-xs text-gray-500 mt-1">{formatDate(notif.created_at)}</p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                 <div className="text-center py-12">
                    <Bell className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900">لا توجد إشعارات</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        {filter === 'unread' ? 'لا توجد إشعارات غير مقروءة.' : 'سيتم عرض تحديثات طلباتك وإشعاراتك المهمة هنا.'}
                    </p>
                </div>
            )}
        </div>
    );
};

export default NotificationPanel;
