'use client';

import { useAuth } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { useAppMutation } from '@alrehla/mutations';
import { scopeResourceKey } from '@alrehla/admin-core/resource';
import type { Notification } from '@alrehla/types';
import { useToast } from '../../../contexts/ToastContext';
import {
  deleteNotification,
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type NotificationMutationResult,
} from './notifications';
import { notificationKeys, notificationListsKey } from './keys';

const unauthenticatedUserId = 'unauthenticated';

export function useUserNotifications() {
  const { userId } = useAuth();
  const queryKey = scopeResourceKey('global', notificationKeys.list(userId ?? unauthenticatedUserId));

  return useQuery<Notification[]>({
    queryKey,
    queryFn: () => (userId ? listNotifications(userId) : []),
    enabled: Boolean(userId),
  });
}

function notificationInvalidationKey(userId: string | null | undefined) {
  return userId
    ? scopeResourceKey('global', notificationListsKey(userId))
    : undefined;
}

function notificationMutationOptions<TInput>(
  userId: string | null | undefined,
  mutationKey: readonly unknown[],
  mutationFn: (input: TInput) => Promise<NotificationMutationResult>,
) {
  const invalidationKey = notificationInvalidationKey(userId);
  return {
    mutationKey: scopeResourceKey('global', mutationKey),
    mutationFn,
    invalidate: invalidationKey ? [invalidationKey] : [],
  } as const;
}

export function useNotificationMutations() {
  const { addToast } = useToast();
  const { userId } = useAuth();

  const markRead = useAppMutation<NotificationMutationResult, { notificationId: Notification['id'] }>(
    notificationMutationOptions(
      userId,
      [...notificationKeys.all, 'mutations', 'mark-read'],
      ({ notificationId }) => markNotificationAsRead(notificationId),
    ),
  );

  const markAllRead = useAppMutation<NotificationMutationResult, void>({
    ...notificationMutationOptions(
      userId,
      [...notificationKeys.all, 'mutations', 'mark-all-read'],
      () => {
        if (!userId) throw new Error('User not authenticated');
        return markAllNotificationsAsRead(userId);
      },
    ),
    onSuccess: () => addToast('تم تحديد الكل كمقروء', 'success'),
  });

  const remove = useAppMutation<NotificationMutationResult, { notificationId: Notification['id'] }>({
    ...notificationMutationOptions(
      userId,
      [...notificationKeys.all, 'mutations', 'delete'],
      ({ notificationId }) => deleteNotification(notificationId),
    ),
    onSuccess: () => addToast('تم حذف الإشعار', 'info'),
  });

  return {
    markNotificationAsRead: markRead,
    markAllNotificationsAsRead: markAllRead,
    deleteNotification: remove,
  };
}
