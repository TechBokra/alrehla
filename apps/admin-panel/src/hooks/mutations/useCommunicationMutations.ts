
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../contexts/ToastContext';
import { communicationService } from '../../services/communicationService';
import type { TicketStatus, RequestStatus } from '../../lib/database.types';
import { scopeResourceKey } from '@alrehla/admin-core/resource';
import { supportKeys } from '../../features/support/api/queries';
import { joinRequestKeys } from '../../features/join-requests/api/queries';
import { adminDashboardKeys } from '../queries/admin/keys';

export const useCommunicationMutations = () => {
    const queryClient = useQueryClient();
    const { addToast } = useToast();

    const createSupportTicket = useMutation({
        mutationFn: communicationService.createSupportTicket,
        onSuccess: () => {
            addToast('تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.', 'success');
            // تحديث بيانات لوحة التحكم وقائمة الرسائل فوراً
            queryClient.invalidateQueries({ queryKey: scopeResourceKey('global', supportKeys.all) });
            queryClient.invalidateQueries({ queryKey: scopeResourceKey('global', adminDashboardKeys.all) });
        },
        onError: (err: Error) => {
            addToast(`فشل إرسال الرسالة: ${err.message}`, 'error');
        }
    });

     const createJoinRequest = useMutation({
        mutationFn: communicationService.createJoinRequest,
        onSuccess: () => {
            addToast('تم إرسال طلبك بنجاح! سنراجعه ونتواصل معك.', 'success');
            // تحديث بيانات لوحة التحكم وقائمة الطلبات فوراً
            queryClient.invalidateQueries({ queryKey: scopeResourceKey('global', joinRequestKeys.all) });
            queryClient.invalidateQueries({ queryKey: scopeResourceKey('global', adminDashboardKeys.all) });
        },
        onError: (err: Error) => {
            addToast(`فشل إرسال الطلب: ${err.message}`, 'error');
        }
    });

    const updateSupportTicketStatus = useMutation({
        mutationFn: async ({ ticketId, newStatus }: { ticketId: string, newStatus: TicketStatus }) => {
            return communicationService.updateSupportTicketStatus(ticketId, newStatus);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: scopeResourceKey('global', supportKeys.all) });
            queryClient.invalidateQueries({ queryKey: scopeResourceKey('global', adminDashboardKeys.all) });
            addToast('تم تحديث حالة الرسالة.', 'success');
        },
        onError: (error: Error) => addToast(`فشل: ${error.message}`, 'error'),
    });

    const updateJoinRequestStatus = useMutation({
        mutationFn: async ({ requestId, newStatus }: { requestId: string, newStatus: RequestStatus }) => {
             return communicationService.updateJoinRequestStatus(requestId, newStatus);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: scopeResourceKey('global', joinRequestKeys.all) });
            queryClient.invalidateQueries({ queryKey: scopeResourceKey('global', adminDashboardKeys.all) });
            addToast('تم تحديث حالة الطلب.', 'success');
        },
        onError: (error: Error) => addToast(`فشل: ${error.message}`, 'error'),
    });

    return { createSupportTicket, createJoinRequest, updateSupportTicketStatus, updateJoinRequestStatus };
};
