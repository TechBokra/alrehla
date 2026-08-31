"use server";

import { communicationService as apiCommunicationService } from '@alrehla/api/services/communicationService';
import { getChildProfileById } from '@alrehla/api-client/resources/auth';
import {
  joinRequestSchema,
  joinRequestStatusSchema,
  notificationSchema,
  numericIdSchema,
  resourceIdSchema,
  supportTicketSchema,
  ticketStatusSchema,
} from '../lib/server/actionSchemas';
import {
  MARKETPLACE_ROLES,
  actionError,
  isDatabaseAdmin,
  parseActionInput,
  requireScheduledSessionManager,
  revalidateMarketplaceTags,
  withMarketplaceAction,
  withPublicAction,
} from '../lib/server/actionSecurity';

const updateOwnedNotification = async (
  actionName: string,
  notificationId: string | number,
  operation: 'read' | 'delete',
) => {
  const id = parseActionInput(numericIdSchema, notificationId);
  return withMarketplaceAction(actionName, async (context) => {
    const query =
      operation === 'delete'
        ? (context.supabase.from('notifications') as any).delete()
        : (context.supabase.from('notifications') as any).update({ read: true });
    const { data, error } = await (query as any)
      .eq('id', id)
      .eq('user_id', context.actor.id)
      .select('id')
      .maybeSingle();

    if (error || !data) {
      actionError('الإشعار غير موجود أو لا تملك صلاحية تعديله.');
    }

    revalidateMarketplaceTags(
      `marketplace:notifications:${context.actor.id}`,
    );
    return { success: true };
  });
};

export const sendNotification = async (
  userId: string,
  message: string,
  link: string,
  type: string = 'info',
) => {
  const input = parseActionInput(notificationSchema, {
    userId,
    message,
    link,
    type,
  });

  return withMarketplaceAction(
    'communication.sendNotification',
    async (context) => {
      if (!isDatabaseAdmin(context.actor) && input.userId !== context.actor.id) {
        if (context.actor.role !== 'instructor') {
          actionError('لا تملك صلاحية إرسال إشعار لهذا المستخدم.');
        }

        const sessionId = /^\/session\/([^/?#]+)$/.exec(input.link)?.[1];
        if (!sessionId) {
          actionError('رابط إشعار الجلسة غير صالح.');
        }

        const scheduledSession = await requireScheduledSessionManager(
          context,
          sessionId,
        );
        const child = await getChildProfileById(
          context.apiClient,
          scheduledSession.child_id,
        );

        if (
          !child ||
          ![(child as any).user_id, (child as any).student_user_id].includes(
            input.userId,
          )
        ) {
          actionError('مستلم الإشعار غير مرتبط بهذه الجلسة.');
        }
      }

      const result = await apiCommunicationService.sendNotification(
        input.userId,
        input.message,
        input.link,
        input.type,
      );
      revalidateMarketplaceTags(
        `marketplace:notifications:${input.userId}`,
      );
      return result;
    },
  );
};

export const notifyAdmins = async (
  message: string,
  link: string,
  type: string = 'admin_alert',
) => {
  const input = parseActionInput(notificationSchema.omit({ userId: true }), {
    message,
    link,
    type,
  });
  return withMarketplaceAction(
    'communication.notifyAdmins',
    () =>
      apiCommunicationService.notifyAdmins(
        input.message,
        input.link,
        input.type,
      ),
    MARKETPLACE_ROLES.databaseAdmins,
  );
};

export const markNotificationAsRead = async (
  notificationId: string | number,
) =>
  updateOwnedNotification(
    'communication.markNotificationAsRead',
    notificationId,
    'read',
  );

export const markAllNotificationsAsRead = async () =>
  withMarketplaceAction(
    'communication.markAllNotificationsAsRead',
    async (context) => {
      const { error } = await (context.supabase
        .from('notifications') as any)
        .update({ read: true })
        .eq('user_id', context.actor.id);

      if (error) {
        actionError('تعذر تحديث الإشعارات.');
      }

      revalidateMarketplaceTags(
        `marketplace:notifications:${context.actor.id}`,
      );
      return { success: true };
    },
  );

export const deleteNotification = async (
  notificationId: string | number,
) =>
  updateOwnedNotification(
    'communication.deleteNotification',
    notificationId,
    'delete',
  );

export const getAllSupportTickets = async () =>
  withMarketplaceAction(
    'communication.getAllSupportTickets',
    () => apiCommunicationService.getAllSupportTickets(),
    MARKETPLACE_ROLES.supportManagers,
  );

export const createSupportTicket = async (payload: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) => {
  const input = parseActionInput(supportTicketSchema, payload) as {
    name: string;
    email: string;
    subject: string;
    message: string;
  };
  return withPublicAction('communication.createSupportTicket', async () => {
    const result = await apiCommunicationService.createSupportTicket(input);
    revalidateMarketplaceTags('marketplace:support-tickets');
    return result;
  });
};

export const getAllJoinRequests = async () =>
  withMarketplaceAction(
    'communication.getAllJoinRequests',
    () => apiCommunicationService.getAllJoinRequests(),
    MARKETPLACE_ROLES.supportManagers,
  );

export const createJoinRequest = async (payload: {
  name: string;
  email: string;
  phone: string;
  role: string;
  message: string;
  portfolio_url?: string;
}) => {
  const input = parseActionInput(joinRequestSchema, payload) as {
    name: string;
    email: string;
    phone: string;
    role: string;
    message: string;
    portfolio_url?: string;
  };
  return withPublicAction('communication.createJoinRequest', async () => {
    const result = await apiCommunicationService.createJoinRequest(input);
    revalidateMarketplaceTags('marketplace:join-requests');
    return result;
  });
};

export const getAllSupportSessionRequests = async () =>
  withMarketplaceAction(
    'communication.getAllSupportSessionRequests',
    () => apiCommunicationService.getAllSupportSessionRequests(),
    MARKETPLACE_ROLES.databaseAdmins,
  );

export const updateSupportTicketStatus = async (
  ticketId: string,
  newStatus: any,
) => {
  const id = parseActionInput(resourceIdSchema, ticketId);
  const status = parseActionInput(ticketStatusSchema, newStatus);
  return withMarketplaceAction(
    'communication.updateSupportTicketStatus',
    async () => {
      const result = await apiCommunicationService.updateSupportTicketStatus(
        id,
        status,
      );
      revalidateMarketplaceTags(
        `marketplace:support-ticket:${id}`,
        'marketplace:support-tickets',
      );
      return result;
    },
    MARKETPLACE_ROLES.supportManagers,
  );
};

export const updateJoinRequestStatus = async (
  requestId: string,
  newStatus: any,
) => {
  const id = parseActionInput(resourceIdSchema, requestId);
  const status = parseActionInput(joinRequestStatusSchema, newStatus);
  return withMarketplaceAction(
    'communication.updateJoinRequestStatus',
    async () => {
      const result = await apiCommunicationService.updateJoinRequestStatus(
        id,
        status,
      );
      revalidateMarketplaceTags(
        `marketplace:join-request:${id}`,
        'marketplace:join-requests',
      );
      return result;
    },
    MARKETPLACE_ROLES.supportManagers,
  );
};
