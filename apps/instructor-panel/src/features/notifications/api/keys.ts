import type { NotificationTab } from './notifications';

export interface NotificationListParams {
  search?: string;
  tab?: NotificationTab;
}

function normalizeParams(params: NotificationListParams): NotificationListParams {
  const search = params.search?.trim();
  const tab = params.tab;

  return {
    ...(search ? { search } : {}),
    ...(tab && tab !== 'all' ? { tab } : {}),
  };
}

/** Resource-relative notification keys. Resource Runtime owns the global scope prefix. */
export const notificationKeys = {
  all: ['userNotifications'] as const,
  user: (userId: string) => [...notificationKeys.all, userId] as const,
  lists: (userId: string) => [...notificationKeys.user(userId), 'lists'] as const,
  list: (userId: string, params: NotificationListParams = {}) => [
    ...notificationKeys.lists(userId),
    normalizeParams(params),
  ] as const,
};

export function notificationListsKey(userId: string | null | undefined) {
  return notificationKeys.lists(userId ?? 'unauthenticated');
}
