
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../contexts/ToastContext';
import { orderService } from '../../services/orderService';

export const useProductMutations = () => {
    const queryClient = useQueryClient();
    const { addToast } = useToast();

    const createPersonalizedProduct = useMutation({
        mutationFn: orderService.createPersonalizedProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminPersonalizedProducts'] });
            addToast('تم إنشاء المنتج بنجاح.', 'success');
        },
        onError: (err: Error) => addToast(`فشل إنشاء المنتج: ${err.message}`, 'error'),
    });
    
    const updatePersonalizedProduct = useMutation({
        mutationFn: orderService.updatePersonalizedProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminPersonalizedProducts'] });
            addToast('تم تحديث المنتج بنجاح.', 'success');
        },
        onError: (err: Error) => addToast(`فشل تحديث المنتج: ${err.message}`, 'error'),
    });

    const deletePersonalizedProduct = useMutation({
        mutationFn: (payload: { productId: number }) => orderService.deletePersonalizedProduct(payload.productId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminPersonalizedProducts'] });
            addToast('تم حذف المنتج بنجاح.', 'info');
        },
        onError: (err: Error) => addToast(`فشل حذف المنتج: ${err.message}`, 'error'),
    });
    
    const approveProduct = useMutation({
        mutationFn: (payload: { productId: number, status: 'approved' | 'rejected' }) => orderService.approveProduct(payload.productId, payload.status),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['adminPersonalizedProducts'] });
            const msg = variables.status === 'approved' ? 'تمت الموافقة على المنتج ونشره.' : 'تم رفض المنتج.';
            addToast(msg, variables.status === 'approved' ? 'success' : 'info');
        },
        onError: (err: Error) => addToast(`فشل تغيير حالة المنتج: ${err.message}`, 'error'),
    });

    return { createPersonalizedProduct, updatePersonalizedProduct, deletePersonalizedProduct, approveProduct };
}
