import * as reportingActions from '../actions/reportingActions';

export const reportingService = {
  logAction: reportingActions.logAction,
  getAuditLogs: reportingActions.getAuditLogs,
  getFinancialOverview: reportingActions.getFinancialOverview,
  getInstructorFinancials: reportingActions.getInstructorFinancials,
  getRevenueStreams: reportingActions.getRevenueStreams,
  getTransactionsLog: reportingActions.getTransactionsLog,
  getPublisherFinancials: reportingActions.getPublisherFinancials,
  getReportData: reportingActions.getReportData,
};
