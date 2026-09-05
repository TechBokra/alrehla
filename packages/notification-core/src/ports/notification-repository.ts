import type {
  Notification,
  NotificationCreateCommand,
  NotificationListQuery,
  NotificationListResult,
  NotificationRecipientQuery,
} from "../contracts/notification";

export interface NotificationCreateResult {
  idempotencyKey: string;
  notifications: Notification[];
  created: boolean;
}

export interface NotificationRepository {
  create(
    command: NotificationCreateCommand & { idempotencyKey: string },
    recipientIds: readonly string[]
  ): Promise<NotificationCreateResult>;
  list(query: NotificationListQuery): Promise<NotificationListResult>;
  unreadCount(query: NotificationRecipientQuery): Promise<number>;
  markRead(
    notificationId: string,
    query: NotificationRecipientQuery
  ): Promise<Notification>;
  markAllRead(query: NotificationRecipientQuery): Promise<{ updated: number }>;
}
