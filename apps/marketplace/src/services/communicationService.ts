import * as communicationActions from '../actions/communicationActions';

export const communicationService = {
  sendNotification: communicationActions.sendNotification,
  notifyAdmins: communicationActions.notifyAdmins,
  markNotificationAsRead: communicationActions.markNotificationAsRead,
  markAllNotificationsAsRead: communicationActions.markAllNotificationsAsRead,
  deleteNotification: communicationActions.deleteNotification,
  getAllSupportTickets: communicationActions.getAllSupportTickets,
  createSupportTicket: communicationActions.createSupportTicket,
  getAllJoinRequests: communicationActions.getAllJoinRequests,
  createJoinRequest: communicationActions.createJoinRequest,
  getAllSupportSessionRequests: communicationActions.getAllSupportSessionRequests,
  updateSupportTicketStatus: communicationActions.updateSupportTicketStatus,
  updateJoinRequestStatus: communicationActions.updateJoinRequestStatus,
};
