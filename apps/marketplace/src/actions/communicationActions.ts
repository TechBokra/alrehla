"use server";

import { communicationService as apiCommunicationService } from '@alrehla/api/services/communicationService';

export const sendNotification = async (userId: string, message: string, link: string, type: string = 'info') => {
  return apiCommunicationService.sendNotification(userId, message, link, type);
};

export const notifyAdmins = async (message: string, link: string, type: string = 'admin_alert') => {
  return apiCommunicationService.notifyAdmins(message, link, type);
};

export const getAllSupportTickets = async () => {
  return apiCommunicationService.getAllSupportTickets();
};

export const createSupportTicket = async (payload: { name: string, email: string, subject: string, message: string }) => {
  return apiCommunicationService.createSupportTicket(payload);
};

export const getAllJoinRequests = async () => {
  return apiCommunicationService.getAllJoinRequests();
};

export const createJoinRequest = async (payload: { name: string, email: string, phone: string, role: string, message: string, portfolio_url?: string }) => {
  return apiCommunicationService.createJoinRequest(payload);
};

export const getAllSupportSessionRequests = async () => {
  return apiCommunicationService.getAllSupportSessionRequests();
};

export const updateSupportTicketStatus = async (ticketId: string, newStatus: any) => {
  return apiCommunicationService.updateSupportTicketStatus(ticketId, newStatus);
};

export const updateJoinRequestStatus = async (requestId: string, newStatus: any) => {
  return apiCommunicationService.updateJoinRequestStatus(requestId, newStatus);
};
