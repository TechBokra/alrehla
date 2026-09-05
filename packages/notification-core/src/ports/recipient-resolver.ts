import type {
  NotificationCreateCommand,
  NotificationRecipient,
} from "../contracts/notification";

export interface NotificationRecipientResolutionInput {
  command: NotificationCreateCommand & { idempotencyKey: string };
}

export interface NotificationRecipientResolver {
  resolve(
    input: NotificationRecipientResolutionInput
  ): Promise<readonly string[] | readonly NotificationRecipient[]>;
}
