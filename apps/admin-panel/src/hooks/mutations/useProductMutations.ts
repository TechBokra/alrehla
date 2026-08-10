
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../contexts/ToastContext';
import {
    approveProduct as approveProductAction,
    createPersonalizedProduct as createPersonalizedProductAction,
    deletePersonalizedProduct as deletePersonalizedProductAction,
    updatePersonalizedProduct as updatePersonalizedProductAction,
} from '../../actions/productActions';

export const useProductMutations = () => {
    const queryClient = useQueryClient();
    const { addToast } = useToast();

    const createPersonalizedProduct = useMutation({
        mutationFn: createPersonalizedProductAction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminPersonalizedProducts'] });
            addToast('تم إنشاء المنتج بنجاح.', 'success');
        },
        onError: (err: Error) => addToast(`فشل إنشاء المنتج: ${err.message}`, 'error'),
    });
    
    const updatePersonalizedProduct = useMutation({
        mutationFn: updatePersonalizedProductAction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminPersonalizedProducts'] });
            addToast('تم تحديث المنتج بنجاح.', 'success');
        },
        onError: (err: Error) => addToast(`فشل تحديث المنتج: ${err.message}`, 'error'),
    });

    const deletePersonalizedProduct = useMutation({
        mutationFn: (payload: { productId: number }) => deletePersonalizedProductAction(payload.productId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminPersonalizedProducts'] });
            addToast('تم حذف المنتج بنجاح.', 'info');
        },
        onError: (err: Error) => addToast(`فشل حذف المنتج: ${err.message}`, 'error'),
    });
    
    const approveProduct = useMutation({
        mutationFn: (payload: { productId: number, status: 'approved' | 'rejected' }) => approveProductAction(payload.productId, payload.status),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['adminPersonalizedProducts'] });
            const msg = variables.status === 'approved' ? 'تمت الموافقة على المنتج ونشره.' : 'تم رفض المنتج.';
            addToast(msg, variables.status === 'approved' ? 'success' : 'info');
        },
        onError: (err: Error) => addToast(`فشل تغيير حالة المنتج: ${err.message}`, 'error'),
    });

    return { createPersonalizedProduct, updatePersonalizedProduct, deletePersonalizedProduct, approveProduct };
}
