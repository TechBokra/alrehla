import type { Permissions, UserRole } from '@alrehla/auth';

export type AdminPermission = keyof Permissions;

export type AdminResourceId =
  | 'dashboard'
  | 'users'
  | 'instructors'
  | 'orders'
  | 'products'
  | 'subscriptions'
  | 'bookings'
  | 'service-orders'
  | 'publisher-products'
  | 'publisher-financials'
  | 'content'
  | 'blog'
  | 'support'
  | 'join-requests'
  | 'financials'
  | 'settings'
  | 'system-config'
  | 'audit-log'
  | 'database-inspector'
  | 'integrations'
  | 'notifications'
  | 'my-profile';

export interface AdminResourceDefinition {
  id: AdminResourceId;
  label: string;
  route: string;
  permission?: AdminPermission;
}

export type AdminQueryKey = readonly [string, ...ReadonlyArray<unknown>];

export interface AdminSession {
  userId: string;
  role: UserRole;
  permissions: Permissions;
}
