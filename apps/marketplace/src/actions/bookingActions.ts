"use server";

import { bookingService as apiBookingService } from '@alrehla/api/services/bookingService';
import type { UserRole } from '@alrehla/types';
import { z } from 'zod';
import {
  comparisonItemSchema,
  creativeWritingPackageSchema,
  numericIdSchema,
  rescheduleRequestSchema,
  resourceIdSchema,
  scheduledSessionUpdateSchema,
  sessionAttachmentSchema,
  sessionMessageSchema,
  standaloneServiceSchema,
} from '../lib/server/actionSchemas';
import {
  MARKETPLACE_ROLES,
  actionError,
  isDatabaseAdmin,
  parseActionInput,
  requireBookingAccess,
  requireScheduledSessionManager,
  revalidateMarketplaceTags,
  withMarketplaceAction,
  withPublicAction,
} from '../lib/server/actionSecurity';

const JOURNEY_ROLES = [
  'user',
  'parent',
  'student',
  'instructor',
  'creative_writing_supervisor',
  ...MARKETPLACE_ROLES.databaseAdmins,
] as const satisfies readonly UserRole[];

const INSTRUCTOR_ROLES = [
  'instructor',
  ...MARKETPLACE_ROLES.databaseAdmins,
] as const satisfies readonly UserRole[];

export const authorizeJourneyAccess = async (bookingId: string) => {
  const id = parseActionInput(resourceIdSchema, bookingId);
  return withMarketplaceAction(
    'booking.authorizeJourneyAccess',
    async (context) => {
      const { booking } = await requireBookingAccess(context, id);
      if (!['مؤكد', 'مكتمل'].includes(booking.status)) {
        actionError('مساحة العمل غير متاحة قبل تأكيد الحجز.');
      }
      return { authorized: true, status: booking.status };
    },
    JOURNEY_ROLES,
  );
};

export const updateBookingProgressNotes = async (
  bookingId: string,
  notes: string,
) => {
  const id = parseActionInput(resourceIdSchema, bookingId);
  const safeNotes = parseActionInput(z.string().trim().max(10_000), notes);
  return withMarketplaceAction(
    'booking.updateBookingProgressNotes',
    async (context) => {
      const { relationship } = await requireBookingAccess(context, id);
      if (relationship !== 'admin' && relationship !== 'instructor') {
        actionError('ملاحظات التقدم متاحة للمدرب أو الإدارة فقط.');
      }

      const result = await apiBookingService.updateBookingProgressNotes(
        id,
        safeNotes,
      );
      revalidateMarketplaceTags(
        `marketplace:booking:${id}`,
        `marketplace:journey:${id}`,
      );
      return result;
    },
    JOURNEY_ROLES,
  );
};

export const saveBookingDraft = async (bookingId: string, draft: string) => {
  const id = parseActionInput(resourceIdSchema, bookingId);
  const safeDraft = parseActionInput(z.string().max(20_000), draft);
  return withMarketplaceAction(
    'booking.saveBookingDraft',
    async (context) => {
      await requireBookingAccess(context, id);
      const result = await apiBookingService.saveBookingDraft(id, safeDraft);
      revalidateMarketplaceTags(`marketplace:journey:${id}`);
      return result;
    },
    JOURNEY_ROLES,
  );
};

export const getAllPackages = async () =>
  withPublicAction('booking.getAllPackages', () =>
    apiBookingService.getAllPackages(),
  );

export const createPackage = async (payload: any) => {
  const input = parseActionInput(creativeWritingPackageSchema, payload);
  return withMarketplaceAction(
    'booking.createPackage',
    async () => {
      const { id: _ignoredId, ...newPackage } = input;
      const result = await apiBookingService.createPackage(newPackage);
      revalidateMarketplaceTags('marketplace:creative-writing-packages');
      return result;
    },
    MARKETPLACE_ROLES.databaseAdmins,
  );
};

export const updatePackage = async (payload: any) => {
  const input = parseActionInput(creativeWritingPackageSchema, payload);
  if (!input.id) actionError('معرف الباقة مطلوب.');
  return withMarketplaceAction(
    'booking.updatePackage',
    async () => {
      const result = await apiBookingService.updatePackage({
        ...input,
        id: input.id!,
      });
      revalidateMarketplaceTags('marketplace:creative-writing-packages');
      return result;
    },
    MARKETPLACE_ROLES.databaseAdmins,
  );
};

export const deletePackage = async (packageId: number) => {
  const id = parseActionInput(numericIdSchema, packageId);
  return withMarketplaceAction(
    'booking.deletePackage',
    async () => {
      const result = await apiBookingService.deletePackage(id);
      revalidateMarketplaceTags('marketplace:creative-writing-packages');
      return result;
    },
    MARKETPLACE_ROLES.databaseAdmins,
  );
};

export const getAllComparisonItems = async () =>
  withPublicAction('booking.getAllComparisonItems', () =>
    apiBookingService.getAllComparisonItems(),
  );

export const createComparisonItem = async (payload: any) => {
  const input = parseActionInput(comparisonItemSchema, payload);
  return withMarketplaceAction(
    'booking.createComparisonItem',
    async () => {
      const result = await apiBookingService.createComparisonItem(input);
      revalidateMarketplaceTags('marketplace:comparison-items');
      return result;
    },
    MARKETPLACE_ROLES.databaseAdmins,
  );
};

export const updateComparisonItem = async (payload: any) => {
  const input = parseActionInput(comparisonItemSchema, payload);
  if (!input.id) actionError('معرف عنصر المقارنة مطلوب.');
  return withMarketplaceAction(
    'booking.updateComparisonItem',
    async () => {
      const result = await apiBookingService.updateComparisonItem({
        ...input,
        id: input.id!,
      });
      revalidateMarketplaceTags('marketplace:comparison-items');
      return result;
    },
    MARKETPLACE_ROLES.databaseAdmins,
  );
};

export const deleteComparisonItem = async (itemId: string) => {
  const id = parseActionInput(resourceIdSchema, itemId);
  return withMarketplaceAction(
    'booking.deleteComparisonItem',
    async () => {
      const result = await apiBookingService.deleteComparisonItem(id);
      revalidateMarketplaceTags('marketplace:comparison-items');
      return result;
    },
    MARKETPLACE_ROLES.databaseAdmins,
  );
};

export const getAllStandaloneServices = async () =>
  withPublicAction('booking.getAllStandaloneServices', () =>
    apiBookingService.getAllStandaloneServices(),
  );

export const createStandaloneService = async (payload: any) => {
  const input = parseActionInput(standaloneServiceSchema, payload);
  return withMarketplaceAction(
    'booking.createStandaloneService',
    async () => {
      const { id: _ignoredId, ...newService } = input;
      const result = await apiBookingService.createStandaloneService(newService);
      revalidateMarketplaceTags('marketplace:standalone-services');
      return result;
    },
    MARKETPLACE_ROLES.databaseAdmins,
  );
};

export const updateStandaloneService = async (payload: any) => {
  const input = parseActionInput(standaloneServiceSchema, payload);
  if (!input.id) actionError('معرف الخدمة مطلوب.');
  return withMarketplaceAction(
    'booking.updateStandaloneService',
    async () => {
      const result = await apiBookingService.updateStandaloneService({
        ...input,
        id: input.id!,
      });
      revalidateMarketplaceTags('marketplace:standalone-services');
      return result;
    },
    MARKETPLACE_ROLES.databaseAdmins,
  );
};

export const deleteStandaloneService = async (serviceId: number) => {
  const id = parseActionInput(numericIdSchema, serviceId);
  return withMarketplaceAction(
    'booking.deleteStandaloneService',
    async () => {
      const result = await apiBookingService.deleteStandaloneService(id);
      revalidateMarketplaceTags('marketplace:standalone-services');
      return result;
    },
    MARKETPLACE_ROLES.databaseAdmins,
  );
};

export const getAllInstructors = async () =>
  withPublicAction('booking.getAllInstructors', () =>
    apiBookingService.getAllInstructors(),
  );

export const getInstructorByUserId = async (userId: string) => {
  const requestedUserId = parseActionInput(resourceIdSchema, userId);
  return withMarketplaceAction(
    'booking.getInstructorByUserId',
    (context) =>
      apiBookingService.getInstructorByUserId(
        isDatabaseAdmin(context.actor) ? requestedUserId : context.actor.id,
      ),
    INSTRUCTOR_ROLES,
  );
};

export const submitRescheduleRequest = async (payload: any) => {
  const input = parseActionInput(rescheduleRequestSchema, payload) as {
    sessionId: string;
    oldDate: string;
    newDate: string;
    newTime: string;
    reason: string;
    instructorName: string;
  };
  return withMarketplaceAction(
    'booking.submitRescheduleRequest',
    async (context) => {
      const scheduledSession = await requireScheduledSessionManager(
        context,
        input.sessionId,
      );
      const { data: instructor, error } = await context.supabase
        .from('instructors')
        .select('name')
        .eq('id', scheduledSession.instructor_id)
        .maybeSingle();

      if (error || !(instructor as any)?.name) {
        actionError('تعذر التحقق من المدرب المرتبط بالجلسة.');
      }

      const result = await apiBookingService.submitRescheduleRequest({
        ...input,
        instructorName: (instructor as any).name,
      });
      revalidateMarketplaceTags(
        `marketplace:session:${input.sessionId}`,
        'marketplace:support-session-requests',
      );
      return result;
    },
    INSTRUCTOR_ROLES,
  );
};

export const updateScheduledSession = async (
  sessionId: string,
  updates: any,
) => {
  const id = parseActionInput(resourceIdSchema, sessionId);
  const safeUpdates = parseActionInput(scheduledSessionUpdateSchema, updates);
  return withMarketplaceAction(
    'booking.updateScheduledSession',
    async (context) => {
      const scheduledSession = await requireScheduledSessionManager(context, id);
      const result = await apiBookingService.updateScheduledSession(
        id,
        safeUpdates,
      );
      revalidateMarketplaceTags(
        `marketplace:session:${id}`,
        scheduledSession.booking_id
          ? `marketplace:journey:${scheduledSession.booking_id}`
          : undefined,
      );
      return result;
    },
    INSTRUCTOR_ROLES,
  );
};

export const sendSessionMessage = async (payload: any) => {
  const input = parseActionInput(sessionMessageSchema, payload);
  return withMarketplaceAction(
    'booking.sendSessionMessage',
    async (context) => {
      await requireBookingAccess(context, input.bookingId);
      const result = await apiBookingService.sendSessionMessage({
        bookingId: input.bookingId,
        senderId: context.actor.id,
        role: context.actor.role,
        message: input.message,
      });
      revalidateMarketplaceTags(`marketplace:journey:${input.bookingId}`);
      return result;
    },
    JOURNEY_ROLES,
  );
};

export const uploadSessionAttachment = async (payload: any) => {
  const input = parseActionInput(sessionAttachmentSchema, payload);
  return withMarketplaceAction(
    'booking.uploadSessionAttachment',
    async (context) => {
      await requireBookingAccess(context, input.bookingId);
      const result = await apiBookingService.uploadSessionAttachment({
        bookingId: input.bookingId,
        uploaderId: context.actor.id,
        role: context.actor.role,
        file: input.file,
      });
      revalidateMarketplaceTags(`marketplace:journey:${input.bookingId}`);
      return result;
    },
    JOURNEY_ROLES,
  );
};
