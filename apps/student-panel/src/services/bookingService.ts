import * as bookingActions from '../actions/bookingActions';

export const bookingService = {
  updateBookingProgressNotes: bookingActions.updateBookingProgressNotes,
  saveBookingDraft: bookingActions.saveBookingDraft,
  getAllPackages: bookingActions.getAllPackages,
  createPackage: bookingActions.createPackage,
  updatePackage: bookingActions.updatePackage,
  deletePackage: bookingActions.deletePackage,
  getAllComparisonItems: bookingActions.getAllComparisonItems,
  createComparisonItem: bookingActions.createComparisonItem,
  updateComparisonItem: bookingActions.updateComparisonItem,
  deleteComparisonItem: bookingActions.deleteComparisonItem,
  getAllStandaloneServices: bookingActions.getAllStandaloneServices,
  createStandaloneService: bookingActions.createStandaloneService,
  updateStandaloneService: bookingActions.updateStandaloneService,
  deleteStandaloneService: bookingActions.deleteStandaloneService,
  getAllInstructors: bookingActions.getAllInstructors,
  getInstructorByUserId: bookingActions.getInstructorByUserId,
  submitRescheduleRequest: bookingActions.submitRescheduleRequest,
  updateScheduledSession: bookingActions.updateScheduledSession,
  sendSessionMessage: bookingActions.sendSessionMessage,
  uploadSessionAttachment: bookingActions.uploadSessionAttachment,
};
