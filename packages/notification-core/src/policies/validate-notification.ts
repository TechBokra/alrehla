import type {
  NotificationCreateCommand,
  NotificationScope,
} from "../contracts/notification";

function requireText(value: string | undefined, name: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError(`Notification ${name} is required`);
  }
  return value.trim();
}

function validateReference(
  reference: { type: string; id: string } | undefined,
  name: string
) {
  if (!reference) return;
  requireText(reference.type, `${name}.type`);
  requireText(reference.id, `${name}.id`);
}

export function validateNotificationScope(
  scope: NotificationScope
): NotificationScope {
  return {
    type: requireText(scope?.type, "scope.type"),
    id: requireText(scope?.id, "scope.id"),
  };
}

export function validateNotificationCommand(
  command: NotificationCreateCommand
): NotificationCreateCommand {
  const scope = validateNotificationScope(command.scope);
  const type = requireText(command.type, "type");
  const title = requireText(command.title, "title");
  if (!["info", "success", "warning", "error"].includes(command.severity)) {
    throw new TypeError("Notification severity is invalid");
  }
  validateReference(command.resource, "resource");
  return {
    ...command,
    type,
    title,
    scope,
    ...(command.description !== undefined
      ? { description: command.description.trim() }
      : {}),
  };
}
