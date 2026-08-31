import {
  canAccessAdmin,
  hasPermission,
  type UserRole,
} from '@alrehla/auth';
import type {
  AdminResourceDefinition,
  AdminResourceId,
} from './types';

export const ADMIN_RESOURCE_DEFINITIONS = [
  { id: 'dashboard', label: 'لوحة التحكم', route: '/', permission: 'canViewDashboard' },
  { id: 'users', label: 'المستخدمون', route: '/users', permission: 'canManageUsers' },
  { id: 'instructors', label: 'المدربون', route: '/instructors', permission: 'canManageInstructors' },
  { id: 'orders', label: 'الطلبات', route: '/orders', permission: 'canManageEnhaLakOrders' },
  { id: 'products', label: 'المنتجات', route: '/personalized-products', permission: 'canManageEnhaLakProducts' },
  { id: 'subscriptions', label: 'الاشتراكات', route: '/subscriptions', permission: 'canManageEnhaLakOrders' },
  { id: 'bookings', label: 'الحجوزات', route: '/creative-writing', permission: 'canManageCreativeWritingBookings' },
  { id: 'service-orders', label: 'طلبات الخدمات', route: '/service-orders', permission: 'canManageCreativeWritingBookings' },
  { id: 'publisher-products', label: 'إدارة كتبي', route: '/publisher-products', permission: 'canManageOwnProducts' },
  { id: 'publisher-financials', label: 'الماليات', route: '/publisher-financials', permission: 'canViewOwnFinancials' },
  { id: 'content', label: 'محتوى الموقع', route: '/content/global', permission: 'canManageSiteContent' },
  { id: 'blog', label: 'المدونة', route: '/blog', permission: 'canManageBlog' },
  { id: 'support', label: 'رسائل الدعم', route: '/support', permission: 'canManageSupportTickets' },
  { id: 'join-requests', label: 'طلبات الانضمام', route: '/join-requests', permission: 'canManageJoinRequests' },
  { id: 'financials', label: 'الماليات', route: '/financials', permission: 'canManageFinancials' },
  { id: 'settings', label: 'الإعدادات العامة', route: '/settings', permission: 'canManageSettings' },
  { id: 'system-config', label: 'تكوين النظام', route: '/system-config', permission: 'canManageSettings' },
  { id: 'audit-log', label: 'سجل النشاطات', route: '/audit-log', permission: 'canViewAuditLog' },
  { id: 'database-inspector', label: 'مراقب القاعدة', route: '/database-inspector', permission: 'canManageSettings' },
  { id: 'integrations', label: 'التكاملات', route: '/integrations', permission: 'canManageSettings' },
  { id: 'notifications', label: 'الإشعارات', route: '/notifications' },
  { id: 'my-profile', label: 'إعدادات الحساب', route: '/my-profile' },
] as const satisfies readonly AdminResourceDefinition[];

const resourceMap = new Map<AdminResourceId, AdminResourceDefinition>(
  ADMIN_RESOURCE_DEFINITIONS.map((resource) => [resource.id, resource]),
);

export const getAdminResource = (
  resourceId: AdminResourceId,
): AdminResourceDefinition | undefined => resourceMap.get(resourceId);

export const canAccessAdminResource = (
  role: UserRole | null | undefined,
  resourceId: AdminResourceId,
): boolean => {
  if (!role || !canAccessAdmin(role)) return false;

  const resource = getAdminResource(resourceId);
  if (!resource) return false;

  return !resource.permission || hasPermission(role, resource.permission);
};

export const getAdminResourcesForRole = (
  role: UserRole | null | undefined,
): readonly AdminResourceDefinition[] =>
  ADMIN_RESOURCE_DEFINITIONS.filter((resource) =>
    canAccessAdminResource(role, resource.id),
  );
