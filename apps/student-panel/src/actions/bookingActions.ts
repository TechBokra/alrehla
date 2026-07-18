"use server";

import { bookingService as apiBookingService } from '@alrehla/api/services/bookingService';

export const getAllBookings = async (options?: any) => {
  return apiBookingService.getAllBookings(options);
};

export const createBooking = async (payload: any) => {
  return apiBookingService.createBooking(payload);
};

export const getBookingAvailability = async () => {
  return apiBookingService.getBookingAvailability();
};

export const updateBookingStatus = async (bookingId: string, newStatus: any) => {
  return apiBookingService.updateBookingStatus(bookingId, newStatus);
};

export const updateBookingProgressNotes = async (bookingId: string, notes: string) => {
  return apiBookingService.updateBookingProgressNotes(bookingId, notes);
};

export const saveBookingDraft = async (bookingId: string, draft: string) => {
  return apiBookingService.saveBookingDraft(bookingId, draft);
};

export const getAllPackages = async () => {
  return apiBookingService.getAllPackages();
};

export const createPackage = async (payload: any) => {
  return apiBookingService.createPackage(payload);
};

export const updatePackage = async (payload: any) => {
  return apiBookingService.updatePackage(payload);
};

export const deletePackage = async (packageId: number) => {
  return apiBookingService.deletePackage(packageId);
};

export const getAllComparisonItems = async () => {
  return apiBookingService.getAllComparisonItems();
};

export const createComparisonItem = async (payload: any) => {
  return apiBookingService.createComparisonItem(payload);
};

export const updateComparisonItem = async (payload: any) => {
  return apiBookingService.updateComparisonItem(payload);
};

export const deleteComparisonItem = async (itemId: string) => {
  return apiBookingService.deleteComparisonItem(itemId);
};

export const getAllStandaloneServices = async () => {
  return apiBookingService.getAllStandaloneServices();
};

export const createStandaloneService = async (payload: any) => {
  return apiBookingService.createStandaloneService(payload);
};

export const updateStandaloneService = async (payload: any) => {
  return apiBookingService.updateStandaloneService(payload);
};

export const deleteStandaloneService = async (serviceId: number) => {
  return apiBookingService.deleteStandaloneService(serviceId);
};

export const getAllInstructors = async () => {
  return apiBookingService.getAllInstructors();
};

export const getInstructorByUserId = async (userId: string) => {
  return apiBookingService.getInstructorByUserId(userId);
};

export const getInstructorBookings = async (instructorId: number) => {
  return apiBookingService.getInstructorBookings(instructorId);
};

export const submitRescheduleRequest = async (payload: any) => {
  return apiBookingService.submitRescheduleRequest(payload);
};

export const updateScheduledSession = async (sessionId: string, updates: any) => {
  return apiBookingService.updateScheduledSession(sessionId, updates);
};

export const sendSessionMessage = async (payload: any) => {
  return apiBookingService.sendSessionMessage(payload);
};

export const uploadSessionAttachment = async (payload: any) => {
  return apiBookingService.uploadSessionAttachment(payload);
};

export const getAllScheduledSessions = async () => {
  return apiBookingService.getAllScheduledSessions();
};

export const checkSlotAvailability = async (instructorId: number, date: string, time: string) => {
  return apiBookingService.checkSlotAvailability(instructorId, date, time);
};
