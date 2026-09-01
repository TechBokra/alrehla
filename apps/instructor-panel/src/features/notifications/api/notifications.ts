import type { Notification } from '@alrehla/types';
import { supabase } from '../../../lib/supabaseClient';
import type { NotificationListParams } from './keys';

export type NotificationTab = 'all' | 'unread' | 'booking';

export interface NotificationFilterParams extends NotificationListParams {
  tab?: NotificationTab;
}

export interface NotificationMutationResult {
  success: true;
}

export type NotificationAction = 'read' | 'mark-all';

export interface NotificationUpdateValues {
  action: NotificationAction;
}

export interface NotificationDeleteInput {
  notificationId: Notification['id'];
  userId: string;
}

export async function listNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function markNotificationAsRead(
  notificationId: Notification['id'],
): Promise<NotificationMutationResult> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);

  if (error) throw error;
  return { success: true };
}

export async function markAllNotificationsAsRead(
  userId: string,
): Promise<NotificationMutationResult> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId);

  if (error) throw error;
  return { success: true };
}

export async function deleteNotification(
  notificationId: Notification['id'],
): Promise<NotificationMutationResult> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  if (error) throw error;
  return { success: true };
}

/** Preserves the existing page filtering semantics; query ordering remains database-owned. */
export function filterNotifications(
  notifications: readonly Notification[],
  params: NotificationFilterParams = {},
): Notification[] {
  const search = params.search?.toLowerCase() ?? '';

  return notifications.filter((notification) => {
    if (params.tab === 'unread' && notification.read) return false;
    if (
      params.tab === 'booking' &&
      notification.type !== 'booking' &&
      notification.type !== 'session'
    ) {
      return false;
    }

    if (params.search?.trim()) {
      return (
        notification.message.toLowerCase().includes(search) ||
        notification.type.toLowerCase().includes(search)
      );
    }

    return true;
  });
}

export function normalizeNotificationTab(value: unknown): NotificationTab {
  return value === 'unread' || value === 'booking' ? value : 'all';
}

export function isNotification(value: unknown): value is Notification {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<Notification>;
  return (
    typeof candidate.id === 'number' &&
    typeof candidate.user_id === 'string' &&
    typeof candidate.message === 'string' &&
    typeof candidate.link === 'string' &&
    typeof candidate.type === 'string' &&
    typeof candidate.read === 'boolean' &&
    typeof candidate.created_at === 'string'
  );
}
