'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Bell,
  CheckCheck,
  Trash2,
  Check,
  ExternalLink,
  ShoppingCart,
  Calendar,
  Info,
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
  Inbox,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@alrehla/ui/card';
import { Button } from '@alrehla/ui/button';
import PageLoader from '@alrehla/ui/page-loader';
import { useUserNotifications } from '../../hooks/queries/user/useUserDataQuery';
import { useNotificationMutations } from '../../hooks/mutations/useNotificationMutations';
import { formatDate } from '../../utils/helpers';
import type { Notification } from '@alrehla/types';

const getNotificationBadge = (type: string) => {
  switch (type) {
    case 'order':
      return {
        icon: <ShoppingCart className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
        bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-100 dark:border-blue-900',
        label: 'طلب جديد',
      };
    case 'booking':
    case 'session':
      return {
        icon: <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
        bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-100 dark:border-purple-900',
        label: 'حجز / جلسة',
      };
    case 'admin_alert':
    case 'warning':
      return {
        icon: <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
        bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900',
        label: 'تنبيه نظام',
      };
    default:
      return {
        icon: <Info className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
        bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900',
        label: 'إشعار عام',
      };
  }
};

const AdminNotificationsPage: React.FC = () => {
  const { data: notifications = [], isLoading, refetch, isRefetching } = useUserNotifications();
  const { markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } =
    useNotificationMutations();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'order' | 'booking'>('all');

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );
  const orderCount = useMemo(
    () => notifications.filter((n) => n.type === 'order').length,
    [notifications]
  );
  const bookingCount = useMemo(
    () => notifications.filter((n) => n.type === 'booking' || n.type === 'session').length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notif) => {
      // Tab filter
      if (activeTab === 'unread' && notif.read) return false;
      if (activeTab === 'order' && notif.type !== 'order') return false;
      if (activeTab === 'booking' && notif.type !== 'booking' && notif.type !== 'session')
        return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          notif.message?.toLowerCase().includes(query) ||
          notif.type?.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [notifications, activeTab, searchQuery]);

  if (isLoading) {
    return <PageLoader text="جاري تحميل الإشعارات..." />;
  }

  return (
    <div className="animate-fadeIn space-y-8 max-w-6xl mx-auto pb-20">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <Bell className="w-7 h-7" />
            </div>
            مركز الإشعارات
            {unreadCount > 0 && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-destructive text-destructive-foreground font-bold">
                {unreadCount} غير مقروء
              </span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            تابع واستعرض كافة التنبيهات والرسائل الخاصة بحسابك والإشعارات الإدارية.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
          {unreadCount > 0 && (
            <Button
              onClick={() => markAllNotificationsAsRead.mutate()}
              loading={markAllNotificationsAsRead.isPending}
              className="flex items-center gap-2"
            >
              <CheckCheck className="w-4 h-4" />
              تحديد الكل كمقروء
            </Button>
          )}
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-all">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
              <Inbox className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">إجمالي الإشعارات</p>
              <h3 className="text-2xl font-bold text-foreground mt-0.5">{notifications.length}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">غير مقروءة</p>
              <h3 className="text-2xl font-bold text-foreground mt-0.5">{unreadCount}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">طلبات إنها لك</p>
              <h3 className="text-2xl font-bold text-foreground mt-0.5">{orderCount}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">حجوزات الجلسات</p>
              <h3 className="text-2xl font-bold text-foreground mt-0.5">{bookingCount}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls & Filter Bar */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                  activeTab === 'all'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                الكل ({notifications.length})
              </button>
              <button
                onClick={() => setActiveTab('unread')}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                  activeTab === 'unread'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                غير مقروءة ({unreadCount})
              </button>
              <button
                onClick={() => setActiveTab('order')}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                  activeTab === 'order'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                الطلبات ({orderCount})
              </button>
              <button
                onClick={() => setActiveTab('booking')}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                  activeTab === 'booking'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                الحجوزات ({bookingCount})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="بحث في الإشعارات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-9 pl-4 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 divide-y divide-border">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notif: Notification) => {
              const badge = getNotificationBadge(notif.type);
              const targetLink =
                notif.link === '/account' ? '/account?tab=myLibrary' : notif.link;

              return (
                <div
                  key={notif.id}
                  className={`p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${
                    !notif.read ? 'bg-primary/5 dark:bg-primary/10 font-medium' : 'hover:bg-muted/30'
                  }`}
                >
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className={`p-3 rounded-xl border shrink-0 ${badge.bg}`}>
                      {badge.icon}
                    </div>

                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                          {badge.label}
                        </span>
                        {!notif.read && (
                          <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
                        )}
                        <span className="text-xs text-muted-foreground" dir="ltr">
                          {formatDate(notif.created_at)}
                        </span>
                      </div>

                      <p className="text-foreground text-sm leading-relaxed">
                        {notif.message}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center border-t sm:border-t-0 pt-3 sm:pt-0 w-full sm:w-auto justify-end">
                    {targetLink && targetLink !== '#' && (
                      <Button
                        as={Link}
                        href={targetLink}
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs font-semibold"
                        onClick={() => {
                          if (!notif.read) {
                            markNotificationAsRead.mutate({ notificationId: notif.id });
                          }
                        }}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        الانتقال
                      </Button>
                    )}

                    {!notif.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markNotificationAsRead.mutate({ notificationId: notif.id })}
                        loading={markNotificationAsRead.isPending}
                        className="gap-1 text-xs text-muted-foreground hover:text-foreground"
                        title="تحديد كمقروء"
                      >
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span className="hidden md:inline">تم القراءة</span>
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteNotification.mutate({ notificationId: notif.id })}
                      loading={deleteNotification.isPending}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                      title="حذف الإشعار"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground">
                <Inbox className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-foreground">لا توجد إشعارات</h4>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                {searchQuery
                  ? 'لم يتم العثور على نتائج تطابق البحث الحالي.'
                  : activeTab !== 'all'
                  ? 'لا توجد إشعارات ضمن التصنيف المختار.'
                  : 'ليس لديك أي إشعارات جديدة حالياً.'}
              </p>
              {searchQuery && (
                <Button variant="outline" size="sm" onClick={() => setSearchQuery('')}>
                  مسح البحث
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminNotificationsPage;
