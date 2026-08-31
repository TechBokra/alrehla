
import { adminQueryKeys, useAdminMutation } from '@alrehla/admin-core';
import { useToast } from '../../contexts/ToastContext';
import {
    approveProduct as approveProductAction,
    createPersonalizedProduct as createPersonalizedProductAction,
    deletePersonalizedProduct as deletePersonalizedProductAction,
    updatePersonalizedProduct as updatePersonalizedProductAction,
} from '../../actions/productActions';

export const useProductMutations = () => {
    const { addToast } = useToast();

    const createPersonalizedProduct = useAdminMutation({
        resource: 'products',
        mutationFn: createPersonalizedProductAction,
        invalidate: [adminQueryKeys.personalizedProducts()],
        onSuccess: () => {
            addToast('تم إنشاء المنتج بنجاح.', 'success');
        },
        onError: (err: Error) => addToast(`فشل إنشاء المنتج: ${err.message}`, 'error'),
    });
    
    const updatePersonalizedProduct = useAdminMutation({
        resource: 'products',
        mutationFn: updatePersonalizedProductAction,
        invalidate: [adminQueryKeys.personalizedProducts()],
        onSuccess: () => {
            addToast('تم تحديث المنتج بنجاح.', 'success');
        },
        onError: (err: Error) => addToast(`فشل تحديث المنتج: ${err.message}`, 'error'),
    });

    const deletePersonalizedProduct = useAdminMutation({
        resource: 'products',
        mutationFn: (payload: { productId: number }) => deletePersonalizedProductAction(payload.productId),
        invalidate: [adminQueryKeys.personalizedProducts()],
        onSuccess: () => {
            addToast('تم حذف المنتج بنجاح.', 'info');
        },
        onError: (err: Error) => addToast(`فشل حذف المنتج: ${err.message}`, 'error'),
    });
    
    const approveProduct = useAdminMutation({
        resource: 'products',
        mutationFn: (payload: { productId: number, status: 'approved' | 'rejected' }) => approveProductAction(payload.productId, payload.status),
        invalidate: [adminQueryKeys.personalizedProducts()],
        onSuccess: (_, variables) => {
            const msg = variables.status === 'approved' ? 'تمت الموافقة على المنتج ونشره.' : 'تم رفض المنتج.';
            addToast(msg, variables.status === 'approved' ? 'success' : 'info');
        },
        onError: (err: Error) => addToast(`فشل تغيير حالة المنتج: ${err.message}`, 'error'),
    });

    return { createPersonalizedProduct, updatePersonalizedProduct, deletePersonalizedProduct, approveProduct };
}
