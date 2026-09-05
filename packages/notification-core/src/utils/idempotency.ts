import type {
  NotificationResourceReference,
  NotificationScope,
} from "../contracts/notification";

/**
 * Builds a deterministic logical identity. Store-scoped commerce events use
 * the compact `store:type:resource` form; other scope types are namespaced so
 * equal IDs in different scope domains cannot collide.
 */
export function buildNotificationIdempotencyKey(
  scope: NotificationScope,
  type: string,
  resource?: NotificationResourceReference
): string {
  const scopePart =
    scope.type === "store" ? scope.id : `${scope.type}:${scope.id}`;
  return [scopePart, type, resource?.id ?? "global"].join(":");
}
