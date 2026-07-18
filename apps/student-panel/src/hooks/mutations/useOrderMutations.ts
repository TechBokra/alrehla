
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../contexts/ToastContext';
import { orderService } from '../../services/orderService';
import type { OrderStatus } from '../../lib/database.types';

export const useOrderMutations = () => {
    const queryClient = useQueryClient();
    const { addToast } = useToast();

    const createOrder = useMutation({
        mutationFn: orderService.createOrder,
        onError: (error: Error) => {
            addToast(`فشل إنشاء الطلب: ${error.message}`, 'error');
        }
    });

    const updateOrderStatus = useMutation({
        mutationFn: (payload: { orderId: string, newStatus: OrderStatus }) => orderService.updateOrderStatus(payload.orderId, payload.newStatus),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
            addToast('تم تحديث حالة الطلب.', 'success');
        },
        onError: (error: Error) => addToast(`فشل تحديث الحالة: ${error.message}`, 'error'),
    });
    
    const updateServiceOrderStatus = useMutation({
        mutationFn: (payload: { orderId: string, newStatus: OrderStatus }) => orderService.updateServiceOrderStatus(payload.orderId, payload.newStatus),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminServiceOrders'] });
            addToast('تم تحديث حالة الطلب.', 'success');
        },
        onError: (error: Error) => addToast(`فشل تحديث الحالة: ${error.message}`, 'error'),
    });

    const assignInstructorToServiceOrder = useMutation({
        mutationFn: (payload: { orderId: string, instructorId: number | null }) => orderService.assignInstructorToServiceOrder(payload.orderId, payload.instructorId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminServiceOrders'] });
            addToast('تم تعيين المدرب بنجاح.', 'success');
        },
        onError: (error: Error) => addToast(`فشل تعيين المدرب: ${error.message}`, 'error'),
    });


    const updateOrderComment = useMutation({
        mutationFn: (payload: { orderId: string, comment: string }) => orderService.updateOrderComment(payload.orderId, payload.comment),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
            addToast('تم حفظ الملاحظة.', 'success');
        },
        onError: (error: Error) => addToast(`فشل حفظ الملاحظة: ${error.message}`, 'error'),
    });

    const updateReceipt = useMutation({
        mutationFn: (payload: { itemId: string; itemType: 'order' | 'booking' | 'subscription'; receiptFile: File; }) => 
            orderService.uploadReceipt(payload.itemId, payload.itemType, payload.receiptFile),
        onSuccess: (data, variables) => {
             queryClient.invalidateQueries({ queryKey: ['userAccountData'] });
             addToast('تم رفع الإيصال بنجاح. طلبك قيد المراجعة.', 'success');
        },
        onError: (error: Error) => {
             addToast(`فشل رفع الإيصال: ${error.message}`, 'error');
        }
    });

    // --- BULK ACTIONS ---
    const bulkUpdateOrderStatus = useMutation({
        mutationFn: (payload: { orderIds: string[], status: OrderStatus }) => orderService.bulkUpdateOrderStatus(payload.orderIds, payload.status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
            addToast('تم تحديث حالة الطلبات المحددة.', 'success');
        },
        onError: (error: Error) => addToast(`فشل تحديث الحالات: ${error.message}`, 'error'),
    });

    const bulkDeleteOrders = useMutation({
        mutationFn: (payload: { orderIds: string[] }) => orderService.bulkDeleteOrders(payload.orderIds),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
            addToast('تم حذف الطلبات المحددة.', 'info');
        },
        onError: (error: Error) => addToast(`فشل حذف الطلبات: ${error.message}`, 'error'),
    });

    return { 
        createOrder, 
        updateOrderStatus, 
        updateOrderComment, 
        updateReceipt, 
        updateServiceOrderStatus, 
        assignInstructorToServiceOrder,
        bulkUpdateOrderStatus,
        bulkDeleteOrders
    };
};
