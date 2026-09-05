import type {
  Notification,
  NotificationCreateCommand,
  NotificationRecipient,
} from "../contracts/notification";
import type {
  NotificationDeliveryAdapter,
  NotificationRecipientResolver,
  NotificationRepository,
} from "../ports";
import { validateNotificationCommand } from "../policies";
import { buildNotificationIdempotencyKey } from "../utils";

export interface CreateNotificationDependencies {
  repository: NotificationRepository;
  recipientResolver: NotificationRecipientResolver;
  delivery?: NotificationDeliveryAdapter;
}

export interface CreateNotificationResult {
  idempotencyKey: string;
  notifications: Notification[];
  created: boolean;
  deliveryFailures: Array<{ recipientId: string; error: unknown }>;
}

function recipientId(value: string | NotificationRecipient): string {
  return typeof value === "string" ? value : value.recipientId;
}

/**
 * Canonical application-level operation. Adapters own persistence and
 * authorization data; callers never coordinate rows and recipients manually.
 */
export async function createNotification(
  command: NotificationCreateCommand,
  dependencies: CreateNotificationDependencies
): Promise<CreateNotificationResult> {
  const validated = validateNotificationCommand(command);
  const idempotencyKey =
    validated.idempotencyKey ??
    buildNotificationIdempotencyKey(
      validated.scope,
      validated.type,
      validated.resource
    );
  const resolved = await dependencies.recipientResolver.resolve({
    command: { ...validated, idempotencyKey },
  });
  const recipientIds = [...new Set(resolved.map(recipientId).filter(Boolean))];
  const persisted = await dependencies.repository.create(
    { ...validated, idempotencyKey },
    recipientIds
  );

  const deliveryFailures: Array<{ recipientId: string; error: unknown }> = [];
  if (dependencies.delivery && persisted.created) {
    for (const notification of persisted.notifications) {
      try {
        await dependencies.delivery.deliver(
          notification,
          notification.recipient
        );
      } catch (error) {
        deliveryFailures.push({
          recipientId: notification.recipient.recipientId,
          error,
        });
      }
    }
  }

  return { ...persisted, deliveryFailures };
}
