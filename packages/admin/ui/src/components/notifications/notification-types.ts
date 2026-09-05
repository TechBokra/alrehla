/**
 * Presentation-only types for the shared Notification UI components.
 *
 * These types deliberately have no knowledge of domain entities or backend
 * providers. Formatting of domain data into these shapes is the
 * responsibility of the consuming application (apps/admin-dashboard).
 */

export type NotificationPresentationTone =
  | "default"
  | "success"
  | "warning"
  | "destructive";

export interface NotificationItemData {
  id: string;
  title: string;
  description?: string;
  /** Pre-formatted human-readable relative or absolute timestamp (e.g. "2 min ago"). */
  timestamp: string;
  unread: boolean;
  tone?: NotificationPresentationTone;
}
