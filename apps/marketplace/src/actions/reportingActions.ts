"use server";

import { reportingService as apiReportingService } from '@alrehla/api/services/reportingService';
import type { UserRole } from '@alrehla/types';
import {
  auditLogInputSchema,
  reportFiltersSchema,
  reportTypeSchema,
  resourceIdSchema,
} from '../lib/server/actionSchemas';
import {
  MARKETPLACE_ROLES,
  isDatabaseAdmin,
  parseActionInput,
  revalidateMarketplaceTags,
  withMarketplaceAction,
} from '../lib/server/actionSecurity';

const PUBLISHER_FINANCIAL_ROLES = [
  'publisher',
  ...MARKETPLACE_ROLES.databaseAdmins,
] as const satisfies readonly UserRole[];

export const logAction = async (
  action: string,
  targetId: string,
  targetDesc: string,
  details: string,
) => {
  const input = parseActionInput(auditLogInputSchema, {
    action,
    targetId,
    targetDesc,
    details,
  }) as {
    action: string;
    targetId: string;
    targetDesc: string;
    details: string;
  };

  return withMarketplaceAction(
    'reporting.logAction',
    async () => {
      const result = await apiReportingService.logAction(
        input.action,
        input.targetId,
        input.targetDesc,
        input.details,
      );
      revalidateMarketplaceTags('marketplace:audit-logs');
      return result;
    },
    MARKETPLACE_ROLES.databaseAdmins,
  );
};

export const getAuditLogs = async (filters: any) => {
  const input = parseActionInput(reportFiltersSchema, filters || {});
  return withMarketplaceAction(
    'reporting.getAuditLogs',
    () => apiReportingService.getAuditLogs(input),
    MARKETPLACE_ROLES.databaseAdmins,
  );
};

export const getFinancialOverview = async () =>
  withMarketplaceAction(
    'reporting.getFinancialOverview',
    () => apiReportingService.getFinancialOverview(),
    MARKETPLACE_ROLES.databaseAdmins,
  );

export const getInstructorFinancials = async () =>
  withMarketplaceAction(
    'reporting.getInstructorFinancials',
    () => apiReportingService.getInstructorFinancials(),
    MARKETPLACE_ROLES.databaseAdmins,
  );

export const getRevenueStreams = async () =>
  withMarketplaceAction(
    'reporting.getRevenueStreams',
    () => apiReportingService.getRevenueStreams(),
    MARKETPLACE_ROLES.databaseAdmins,
  );

export const getTransactionsLog = async () =>
  withMarketplaceAction(
    'reporting.getTransactionsLog',
    () => apiReportingService.getTransactionsLog(),
    MARKETPLACE_ROLES.databaseAdmins,
  );

export const getPublisherFinancials = async (publisherId: string) => {
  const requestedPublisherId = parseActionInput(resourceIdSchema, publisherId);
  return withMarketplaceAction(
    'reporting.getPublisherFinancials',
    (context) =>
      apiReportingService.getPublisherFinancials(
        isDatabaseAdmin(context.actor)
          ? requestedPublisherId
          : context.actor.id,
      ),
    PUBLISHER_FINANCIAL_ROLES,
  );
};

export const getReportData = async (
  reportType: 'orders' | 'users' | 'instructors',
  filters: any,
) => {
  const type = parseActionInput(reportTypeSchema, reportType);
  const input = parseActionInput(reportFiltersSchema, filters || {});
  return withMarketplaceAction(
    'reporting.getReportData',
    () => apiReportingService.getReportData(type, input),
    MARKETPLACE_ROLES.databaseAdmins,
  );
};
