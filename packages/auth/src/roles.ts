
import type { AccountType, GlobalRole, OrganizationRole, UserRole } from '@alrehla/types';
export type { UserRole };
export type { AccountType, GlobalRole, OrganizationRole };

export const ACCOUNT_TYPES = ['parent', 'student'] as const;
export const GLOBAL_ROLES = ['super_admin', 'support_admin'] as const;
export const ORGANIZATION_ROLES = [
  'org:general_supervisor',
  'org:instructor',
  'org:publisher',
] as const;

export const roleNames: Record<UserRole, string> = {
  user: 'مستخدم عادي',
  parent: 'ولي أمر',
  student: 'طالب',
  super_admin: 'مدير النظام',
  general_supervisor: 'مشرف عام',
  enha_lak_supervisor: 'مشرف إنها لك',
  creative_writing_supervisor: 'مشرف بداية الرحلة',
  instructor: 'مدرب',
  content_editor: 'محرر محتوى',
  support_agent: 'وكيل دعم',
  publisher: 'دار نشر',
};

// تصنيف الأدوار لتسهيل الفصل في الإدارة
export const STAFF_ROLES: UserRole[] = [
    'super_admin',
    'general_supervisor',
    'enha_lak_supervisor',
    'creative_writing_supervisor',
    'instructor',
    'content_editor',
    'support_agent',
    'publisher'
];

export const CUSTOMER_ROLES: UserRole[] = [
    'user',
    'parent',
    'student'
];

export interface Permissions {
  canViewDashboard: boolean;
  canViewGlobalStats: boolean;
  canViewContentStats: boolean;
  canManageEnhaLakOrders: boolean;
  canManageCreativeWritingBookings: boolean;
  canManageEnhaLakProducts: boolean;
  canManageCreativeWritingSettings: boolean;
  canManageUsers: boolean;
  canManageInstructors: boolean;
  canManageInstructorUpdates: boolean;
  canManageBlog: boolean;
  canManageSiteContent: boolean;
  canManageSupportTickets: boolean;
  canManageJoinRequests: boolean;
  canManageSettings: boolean;
  canManageFinancials: boolean; 
  canViewAuditLog: boolean;
  isInstructor: boolean;
  canManageOwnSchedule: boolean;
  canManageOwnProfile: boolean;
  canViewOwnFinancials: boolean;
  isPublisher: boolean;
  canManageOwnProducts: boolean;
}

export const permissionKeys: (keyof Permissions)[] = [
    'canViewDashboard',
    'canViewGlobalStats',
    'canViewContentStats',
    'canManageEnhaLakOrders',
    'canManageCreativeWritingBookings',
    'canManageEnhaLakProducts',
    'canManageCreativeWritingSettings',
    'canManageUsers',
    'canManageInstructors',
    'canManageInstructorUpdates',
    'canManageBlog',
    'canManageSiteContent',
    'canManageSupportTickets',
    'canManageJoinRequests',
    'canManageSettings',
    'canManageFinancials',
    'canViewAuditLog',
    'isInstructor',
    'canManageOwnSchedule',
    'canManageOwnProfile',
    'canViewOwnFinancials',
    'isPublisher',
    'canManageOwnProducts'
];

export const permissionLabels: Record<keyof Permissions, string> = {
    canViewDashboard: 'عرض لوحة التحكم الرئيسية',
    canViewGlobalStats: 'عرض الإحصائيات العامة',
    canViewContentStats: 'عرض إحصائيات المحتوى',
    canManageEnhaLakOrders: 'إدارة طلبات "إنها لك"',
    canManageCreativeWritingBookings: 'إدارة حجوزات "بداية الرحلة"',
    canManageEnhaLakProducts: 'إدارة منتجات "إنها لك"',
    canManageCreativeWritingSettings: 'إدارة إعدادات "بداية الرحلة"',
    canManageUsers: 'إدارة المستخدمين',
    canManageInstructors: 'إدارة المدربين',
    canManageInstructorUpdates: 'إدارة تحديثات المدربين',
    canManageBlog: 'إدارة المدونة',
    canManageSiteContent: 'إدارة محتوى الموقع',
    canManageSupportTickets: 'إدارة رسائل الدعم',
    canManageJoinRequests: 'إدارة طلبات الانضمام',
    canManageSettings: 'إدارة الإعدادات العامة',
    canManageFinancials: 'إدارة الشؤون المالية',
    canViewAuditLog: 'عرض سجل النشاطات',
    isInstructor: 'دور مدرب',
    canManageOwnSchedule: 'إدارة جدوله الخاص',
    canManageOwnProfile: 'إدارة ملفه الشخصي',
    canViewOwnFinancials: 'عرض بياناته المالية',
    isPublisher: 'دور دار نشر',
    canManageOwnProducts: 'إدارة منتجاته الخاصة'
};

export const defaultPermissions: Permissions = {
  canViewDashboard: false,
  canViewGlobalStats: false,
  canViewContentStats: false,
  canManageEnhaLakOrders: false,
  canManageCreativeWritingBookings: false,
  canManageEnhaLakProducts: false,
  canManageCreativeWritingSettings: false,
  canManageUsers: false,
  canManageInstructors: false,
  canManageInstructorUpdates: false,
  canManageBlog: false,
  canManageSiteContent: false,
  canManageSupportTickets: false,
  canManageJoinRequests: false,
  canManageSettings: false,
  canManageFinancials: false,
  canViewAuditLog: false,
  isInstructor: false,
  canManageOwnSchedule: false,
  canManageOwnProfile: false,
  canViewOwnFinancials: false,
  isPublisher: false,
  canManageOwnProducts: false,
};

export const permissionsByRole: Record<UserRole, Permissions> = {
  super_admin: {
      canViewDashboard: true, canViewGlobalStats: true, canViewContentStats: true, canManageEnhaLakOrders: true,
      canManageCreativeWritingBookings: true, canManageEnhaLakProducts: true, canManageCreativeWritingSettings: true,
      canManageUsers: true, canManageInstructors: true, canManageInstructorUpdates: true, canManageBlog: true,
      canManageSiteContent: true, canManageSupportTickets: true, canManageJoinRequests: true, canManageSettings: true,
      canManageFinancials: true, canViewAuditLog: true, isInstructor: false, canManageOwnSchedule: false,
      canManageOwnProfile: false, canViewOwnFinancials: false, isPublisher: false, canManageOwnProducts: false
  },
  general_supervisor: {
    ...defaultPermissions,
    canViewDashboard: true, canViewGlobalStats: true, canViewContentStats: true, canManageEnhaLakOrders: true,
    canManageCreativeWritingBookings: true, canManageUsers: true, canManageInstructors: true, 
    canManageInstructorUpdates: true, canManageSupportTickets: true, canManageFinancials: true,
  },
  enha_lak_supervisor: {
    ...defaultPermissions,
    canViewDashboard: true, canManageEnhaLakOrders: true, canManageEnhaLakProducts: true,
  },
  creative_writing_supervisor: {
    ...defaultPermissions,
    canViewDashboard: true, canViewGlobalStats: false, canManageCreativeWritingBookings: true, canManageCreativeWritingSettings: true,
    canManageInstructors: true, canManageInstructorUpdates: true,
  },
  instructor: {
    ...defaultPermissions,
    canViewDashboard: true, isInstructor: true, canManageOwnSchedule: true, canManageOwnProfile: true, canViewOwnFinancials: true,
  },
  publisher: {
    ...defaultPermissions,
    canViewDashboard: true, isPublisher: true, canManageOwnProducts: true,
  },
  content_editor: {
    ...defaultPermissions,
    canViewDashboard: true, canManageBlog: true, canManageSiteContent: true,
  },
  support_agent: {
    ...defaultPermissions,
    canViewDashboard: true, canManageSupportTickets: true, canManageJoinRequests: true,
  },
  user: defaultPermissions,
  parent: defaultPermissions,
  student: defaultPermissions,
};

export const getPermissions = (role: UserRole): Permissions => {
  return permissionsByRole[role] || defaultPermissions;
};


export const hasPermission = (role: UserRole, permission: keyof Permissions): boolean => {
  return Boolean(getPermissions(role)[permission]);
};

export const isAdminRole = (role: UserRole): boolean => STAFF_ROLES.includes(role);

export const canAccessAdmin = (role?: UserRole | null): boolean => {
  return Boolean(role && isAdminRole(role));
};
