import type { AdminQueryKey, AdminResourceId } from './types';

export const adminQueryKeys = {
  all: ['admin'] as const,
  dashboard: (section?: string): AdminQueryKey =>
    section ? ['adminDashboard', section] : ['adminDashboard'],
  auditLog: (filters?: unknown): AdminQueryKey =>
    filters === undefined ? ['adminAuditLog'] : ['adminAuditLog', filters],
  users: (filters?: unknown): AdminQueryKey =>
    filters === undefined ? ['adminUsers'] : ['adminUsers', filters],
  allChildProfiles: () => ['adminAllChildProfiles'] as const,
  publishers: () => ['allPublishers'] as const,
  publisherProfile: (userId?: string): AdminQueryKey =>
    userId === undefined ? ['publisherProfile'] : ['publisherProfile', userId],
  instructors: () => ['adminInstructors'] as const,
  instructorUpdates: () => ['adminInstructorUpdates'] as const,
  instructorPayouts: () => ['adminInstructorPayouts'] as const,
  bookings: (options?: unknown): AdminQueryKey =>
    options === undefined ? ['adminRawCwBookings'] : ['adminRawCwBookings', options],
  supportTickets: () => ['adminSupportTickets'] as const,
  joinRequests: () => ['adminJoinRequests'] as const,
  supportSessionRequests: () => ['adminSupportSessionRequests'] as const,
  serviceOrders: () => ['adminServiceOrders'] as const,
  scheduledSessions: () => ['adminScheduledSessions'] as const,
  orders: (options?: unknown): AdminQueryKey =>
    options === undefined ? ['adminOrders'] : ['adminOrders', options],
  subscriptions: () => ['adminSubscriptions'] as const,
  subscriptionPlans: () => ['adminSubscriptionPlans'] as const,
  personalizedProducts: () => ['adminPersonalizedProducts'] as const,
  financials: () => ['adminFinancials'] as const,
  financialOverview: () => ['adminFinancialsOverview'] as const,
  instructorFinancials: () => ['adminInstructorFinancials'] as const,
  revenueStreams: () => ['adminRevenueStreams'] as const,
  transactionsLog: () => ['adminTransactionsLog'] as const,
  siteContent: () => ['adminSiteContent'] as const,
  blogPosts: () => ['adminBlogPosts'] as const,
  creativeWritingSettings: () => ['adminCWSettings'] as const,
  socialLinks: () => ['adminSocialLinks'] as const,
  communicationSettings: () => ['adminCommunicationSettings'] as const,
  jitsiSettings: () => ['adminJitsiSettings'] as const,
  pricingSettings: () => ['adminPricingSettings'] as const,
  libraryPricingSettings: () => ['adminLibraryPricingSettings'] as const,
  rolePermissions: () => ['adminRolePermissions'] as const,
  systemConfig: () => ['adminSystemConfig'] as const,
  maintenanceSettings: () => ['adminMaintenanceSettings'] as const,
} as const;

export const adminMutationKeys = {
  all: ['admin', 'mutations'] as const,
  resource: (resource: AdminResourceId) =>
    ['admin', 'mutations', resource] as const,
} as const;
