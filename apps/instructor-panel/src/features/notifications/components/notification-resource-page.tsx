'use client';

import React from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Bell,
  Calendar,
  Check,
  CheckCheck,
  ExternalLink,
  Info,
  Inbox,
  RefreshCw,
  Search,
  ShoppingCart,
  Trash2,
} from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { ResourcePage, ResourceErrorState } from '@alrehla/ui/components/resource';
import { Card, CardContent, CardHeader } from '@alrehla/ui/card';
import { Button } from '@alrehla/ui/button';
import PageLoader from '@alrehla/ui/page-loader';
import { useResource } from '@alrehla/admin-core/resource';
import type { Notification } from '@alrehla/types';
import { useToast } from '../../../contexts/ToastContext';
import { formatDate } from '../../../utils/helpers';
import {
  filterNotifications,
  normalizeNotificationTab,
  type NotificationUpdateValues,
  type NotificationTab,
} from '../api/notifications';
import { notificationResource } from '../resource/notification-resource';

function getNotificationBadge(type: string) {
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
}

function NotificationResourceBody() {
  const { dataView, actions, pending } = useResource<
    Notification,
    never,
    NotificationUpdateValues,
    Notification[]
  >();
  const { addToast } = useToast();

  const activeTab = normalizeNotificationTab(dataView.state.filters.tab);
  const searchQuery = dataView.searchInput;
  const notifications = dataView.data;
  const filteredNotifications = filterNotifications(notifications, {
    tab: activeTab,
    search: searchQuery,
  });
  const unreadCount = notifications.filter((notification) => !notification.read).length;
  const bookingCount = notifications.filter(
    (notification) => notification.type === 'booking' || notification.type === 'session',
  ).length;

  const setTab = (tab: NotificationTab) => {
    dataView.onFilterChange('tab', tab);
  };

  if (dataView.loading) {
    return <PageLoader text="جاري تحميل الإشعارات..." />;
  }

  if (dataView.error) {
    return <ResourceErrorState message={dataView.error.message} onRetry={dataView.onRetry} />;
  }

  return (
    <div className="animate-fadeIn space-y-8 max-w-6xl mx-auto pb-20">
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
            تابع واستعرض كافة التنبيهات والرسائل الخاصة بجدولك وحجوزات الطلاب.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={dataView.onRetry}
            disabled={dataView.isRefetching}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${dataView.isRefetching ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
          {unreadCount > 0 && (
            <Button
              onClick={() => {
                const firstNotification = notifications[0];
                if (!firstNotification) return;
                void actions
                  .update(firstNotification, { action: 'mark-all' })
                  .then(() => addToast('تم تحديد الكل كمقروء', 'success'))
                  .catch(() => undefined);
              }}
              loading={pending.update}
              className="flex items-center gap-2"
            >
              <CheckCheck className="w-4 h-4" />
              تحديد الكل كمقروء
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
              <NotificationTabButton active={activeTab === 'all'} onClick={() => setTab('all')}>
                الكل ({notifications.length})
              </NotificationTabButton>
              <NotificationTabButton
                active={activeTab === 'unread'}
                onClick={() => setTab('unread')}
              >
                غير مقروءة ({unreadCount})
              </NotificationTabButton>
              <NotificationTabButton
                active={activeTab === 'booking'}
                onClick={() => setTab('booking')}
              >
                الجلسات والحجوزات ({bookingCount})
              </NotificationTabButton>
            </div>

            <div className="relative w-full md:w-72">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="بحث في الإشعارات..."
                aria-label="بحث في الإشعارات"
                value={searchQuery}
                onChange={(event) => dataView.onSearchInputChange(event.target.value)}
                className="w-full pr-9 pl-4 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 divide-y divide-border">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <NotificationListItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={() => {
                  void actions.update(notification, { action: 'read' }).catch(() => undefined);
                }}
                onDelete={() => {
                  void actions
                    .delete(notification)
                    .then(() => addToast('تم حذف الإشعار', 'info'))
                    .catch(() => undefined);
                }}
                markAsReadPending={pending.update}
                deletePending={pending.delete}
              />
            ))
          ) : (
            <NotificationEmptyState
              searchQuery={searchQuery}
              activeTab={activeTab}
              onClearSearch={() => dataView.onSearchChange('')}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function NotificationTabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick(): void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
        active
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );
}

function NotificationListItem({
  notification,
  onMarkAsRead,
  onDelete,
  markAsReadPending,
  deletePending,
}: {
  notification: Notification;
  onMarkAsRead(): void;
  onDelete(): void;
  markAsReadPending: boolean;
  deletePending: boolean;
}) {
  const badge = getNotificationBadge(notification.type);
  const targetLink = notification.link || '/notifications';

  return (
    <div
      className={`p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${
        !notification.read ? 'bg-primary/5 dark:bg-primary/10 font-medium' : 'hover:bg-muted/30'
      }`}
    >
      <div className="flex items-start gap-4 flex-1 min-w-0">
        <div className={`p-3 rounded-xl border shrink-0 ${badge.bg}`}>{badge.icon}</div>
        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground">
              {badge.label}
            </span>
            {!notification.read && (
              <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
            )}
            <span className="text-xs text-muted-foreground" dir="ltr">
              {formatDate(notification.created_at)}
            </span>
          </div>
          <p className="text-foreground text-sm leading-relaxed">{notification.message}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center border-t sm:border-t-0 pt-3 sm:pt-0 w-full sm:w-auto justify-end">
        {targetLink && targetLink !== '#' && (
          <Button
            as={Link}
            href={targetLink}
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs font-semibold"
            onClick={() => {
              if (!notification.read) onMarkAsRead();
            }}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            الانتقال
          </Button>
        )}

        {!notification.read && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMarkAsRead}
            loading={markAsReadPending}
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
          onClick={onDelete}
          loading={deletePending}
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8"
          title="حذف الإشعار"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function NotificationEmptyState({
  searchQuery,
  activeTab,
  onClearSearch,
}: {
  searchQuery: string;
  activeTab: NotificationTab;
  onClearSearch(): void;
}) {
  return (
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
        <Button variant="outline" size="sm" onClick={onClearSearch}>
          مسح البحث
        </Button>
      )}
    </div>
  );
}

export function NotificationResourcePage() {
  const { userId } = useAuth();
  const executionContext = React.useMemo(
    () => ({ userId: userId ?? undefined }),
    [userId],
  );

  return (
    <ResourcePage
      resource={notificationResource}
      executionContext={executionContext}
      className="max-w-6xl"
    >
      <NotificationResourceBody />
    </ResourcePage>
  );
}

export default NotificationResourcePage;
