'use client';

import { defineResource, normalizeResourceList } from '@alrehla/admin-core/resource';
import type { Notification } from '@alrehla/types';
import { notificationKeys } from '../api/keys';
import {
  deleteNotification,
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type NotificationDeleteInput,
  type NotificationUpdateValues,
} from '../api/notifications';

export type NotificationResourceQuery = Notification[];

export const notificationResource = defineResource<
  Notification,
  never,
  NotificationUpdateValues,
  NotificationResourceQuery,
  unknown,
  Record<string, string>,
  NotificationDeleteInput
>({
  scope: 'global',
  metadata: {
    name: 'instructor-notifications',
    label: 'مركز الإشعارات',
    singularLabel: 'إشعار',
    pluralLabel: 'الإشعارات',
    description: 'تابع واستعرض كافة التنبيهات والرسائل الخاصة بجدولك وحجوزات الطلاب.',
  },
  capabilities: {
    create: false,
    update: true,
    delete: true,
    import: false,
    export: false,
    selection: false,
    bulkActions: false,
  },
  query: {
    queryKey: ({ execution }) => notificationKeys.list(execution?.userId ?? 'unauthenticated'),
    queryFn: ({ execution }) =>
      execution?.userId ? listNotifications(execution.userId) : [],
    normalize: (rows) => normalizeResourceList(rows, rows.length),
    enabled: ({ execution }) => Boolean(execution?.userId),
  },
  mutations: {
    update: {
      mutationKey: [...notificationKeys.all, 'mutations', 'update'],
      mutationFn: ({ record, values }, context) => {
        const userId = context.execution?.userId ?? record.user_id;
        return values.action === 'mark-all'
          ? markAllNotificationsAsRead(userId)
          : markNotificationAsRead(record.id);
      },
      getInput: ({ record, values }) => ({ record, values }),
      invalidateQueries: (_result, variables) => [notificationKeys.lists(variables.record.user_id)],
    },
    delete: {
      mutationKey: [...notificationKeys.all, 'mutations', 'delete'],
      mutationFn: ({ notificationId }) => deleteNotification(notificationId),
      getInput: (record) => ({ notificationId: record.id, userId: record.user_id }),
      invalidateQueries: (_result, variables) => [notificationKeys.lists(variables.userId)],
    },
  },
  dataView: {
    columns: [],
    getRowId: (notification) => String(notification.id),
    search: {
      enabled: true,
      placeholder: 'بحث في الإشعارات...',
      ariaLabel: 'بحث في الإشعارات',
      debounceMs: 300,
    },
    filters: [
      {
        id: 'tab',
        label: 'التصنيف',
        type: 'enum',
        options: [
          { value: 'all', label: 'الكل' },
          { value: 'unread', label: 'غير مقروءة' },
          { value: 'booking', label: 'الجلسات والحجوزات' },
        ],
      },
    ],
    processingMode: 'client',
    pageSizeOptions: [1000],
    urlState: {
      defaults: { page: 1, pageSize: 1000, filters: { tab: 'all' } },
    },
  },
  emptyState: {
    title: 'لا توجد إشعارات',
    description: 'ليس لديك أي إشعارات جديدة حالياً.',
  },
});
