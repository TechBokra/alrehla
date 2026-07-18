
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../contexts/ToastContext';
import { settingsService } from '../../services/settingsService';

export const useProductSettingsMutations = () => {
    const queryClient = useQueryClient();
    const { addToast } = useToast();

    const updatePrices = useMutation({
        mutationFn: settingsService.updatePrices,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['prices'] });
            addToast('تم تحديث الأسعار بنجاح.', 'success');
        },
        onError: (error: Error) => {
            addToast(`فشل تحديث الأسعار: ${error.message}`, 'error');
        }
    });
    
    const updateBranding = useMutation({
        mutationFn: settingsService.updateBranding,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['siteBranding'] });
            queryClient.invalidateQueries({ queryKey: ['publicData'] });
            addToast('تم تحديث العلامة التجارية بنجاح.', 'success');
        },
        onError: (error: Error) => {
            addToast(`فشل تحديث العلامة التجارية: ${error.message}`, 'error');
        }
    });

    const updateShippingCosts = useMutation({
        mutationFn: settingsService.updateShippingCosts,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shippingCosts'] });
            addToast('تم تحديث تكاليف الشحن بنجاح.', 'success');
        },
        onError: (error: Error) => {
            addToast(`فشل تحديث تكاليف الشحن: ${error.message}`, 'error');
        }
    });

    return { updatePrices, updateBranding, updateShippingCosts };
};
