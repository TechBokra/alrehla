export type NotificationSeverity = "info" | "success" | "warning" | "error";

export interface NotificationScope {
  type: string;
  id: string;
}

export interface NotificationResourceReference {
  type: string;
  id: string;
}

export interface NotificationRecipient {
  recipientId: string;
  readAt?: Date | string | null;
  archivedAt?: Date | string | null;
  deliveredAt?: Date | string | null;
}

export interface Notification {
  id: string;
  idempotencyKey: string;
  type: string;
  severity: NotificationSeverity;
  scope: NotificationScope;
  title: string;
  description?: string;
  resource?: NotificationResourceReference;
  data?: Record<string, unknown>;
  createdAt: Date | string;
  recipient: NotificationRecipient;
}

export interface NotificationCreateCommand {
  type: string;
  severity: NotificationSeverity;
  scope: NotificationScope;
  title: string;
  description?: string;
  resource?: NotificationResourceReference;
  data?: Record<string, unknown>;
  recipientPolicy?: string;
  idempotencyKey?: string;
}

export interface NotificationListQuery {
  scope: NotificationScope;
  recipientId: string;
  status?: "all" | "unread";
  type?: string;
  severity?: NotificationSeverity;
  limit?: number;
  offset?: number;
}

export interface NotificationListResult {
  notifications: Notification[];
  count: number;
  limit: number;
  offset: number;
}

export interface NotificationRecipientQuery {
  scope: NotificationScope;
  recipientId: string;
}
