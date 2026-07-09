"use server";

import { reportingService as apiReportingService } from '@alrehla/api/services/reportingService';

export const logAction = async (action: string, targetId: string, targetDesc: string, details: string) => {
  return apiReportingService.logAction(action, targetId, targetDesc, details);
};

export const getAuditLogs = async (filters: any) => {
  return apiReportingService.getAuditLogs(filters);
};

export const getFinancialOverview = async () => {
  return apiReportingService.getFinancialOverview();
};

export const getInstructorFinancials = async () => {
  return apiReportingService.getInstructorFinancials();
};

export const getRevenueStreams = async () => {
  return apiReportingService.getRevenueStreams();
};

export const getTransactionsLog = async () => {
  return apiReportingService.getTransactionsLog();
};

export const getPublisherFinancials = async (publisherId: string) => {
  return apiReportingService.getPublisherFinancials(publisherId);
};

export const getReportData = async (reportType: 'orders' | 'users' | 'instructors', filters: any) => {
  return apiReportingService.getReportData(reportType, filters);
};
