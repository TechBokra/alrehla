import type {
  Notification,
  NotificationRecipient,
} from "../contracts/notification";

/** Optional post-persistence delivery hook for future transports. */
export interface NotificationDeliveryAdapter {
  deliver(
    notification: Notification,
    recipient: NotificationRecipient
  ): Promise<void>;
}
