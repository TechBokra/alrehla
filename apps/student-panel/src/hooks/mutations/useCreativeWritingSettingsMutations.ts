
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../contexts/ToastContext';
import { bookingService } from '../../services/bookingService';

export const useCreativeWritingSettingsMutations = () => {
    const queryClient = useQueryClient();
    const { addToast } = useToast();

    // Mutations for Packages
    const createPackage = useMutation({
        mutationFn: bookingService.createPackage,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminCWSettings'] });
            addToast('تم إنشاء الباقة بنجاح.', 'success');
        },
        onError: (err: Error) => addToast(`فشل إنشاء الباقة: ${err.message}`, 'error'),
    });

    const updatePackage = useMutation({
        mutationFn: bookingService.updatePackage,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminCWSettings'] });
            addToast('تم تحديث الباقة بنجاح.', 'success');
        },
        onError: (err: Error) => addToast(`فشل تحديث الباقة: ${err.message}`, 'error'),
    });

    const deletePackage = useMutation({
        mutationFn: ({ packageId }: { packageId: number }) => bookingService.deletePackage(packageId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminCWSettings'] });
            addToast('تم حذف الباقة بنجاح.', 'info');
        },
        onError: (err: Error) => addToast(`فشل حذف الباقة: ${err.message}`, 'error'),
    });
    
    // Mutations for Comparison Items
    const createComparisonItem = useMutation({
        mutationFn: bookingService.createComparisonItem,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminCWSettings'] });
            addToast('تمت إضافة البند بنجاح.', 'success');
        },
        onError: (err: Error) => addToast(`فشل إضافة البند: ${err.message}`, 'error'),
    });

    const updateComparisonItem = useMutation({
        mutationFn: bookingService.updateComparisonItem,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminCWSettings'] });
            addToast('تم تحديث البند بنجاح.', 'success');
        },
        onError: (err: Error) => addToast(`فشل تحديث البند: ${err.message}`, 'error'),
    });

    const deleteComparisonItem = useMutation({
        mutationFn: ({ itemId }: { itemId: string }) => bookingService.deleteComparisonItem(itemId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminCWSettings'] });
            addToast('تم حذف البند بنجاح.', 'info');
        },
        onError: (err: Error) => addToast(`فشل حذف البند: ${err.message}`, 'error'),
    });


    // Mutations for Standalone Services
    const createStandaloneService = useMutation({
        mutationFn: bookingService.createStandaloneService,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminCWSettings'] });
            addToast('تم إنشاء الخدمة بنجاح.', 'success');
        },
        onError: (err: Error) => addToast(`فشل إنشاء الخدمة: ${err.message}`, 'error'),
    });

    const updateStandaloneService = useMutation({
        mutationFn: bookingService.updateStandaloneService,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminCWSettings'] });
            addToast('تم تحديث الخدمة بنجاح.', 'success');
        },
        onError: (err: Error) => addToast(`فشل تحديث الخدمة: ${err.message}`, 'error'),
    });

    const deleteStandaloneService = useMutation({
        mutationFn: ({ serviceId }: { serviceId: number }) => bookingService.deleteStandaloneService(serviceId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminCWSettings'] });
            addToast('تم حذف الخدمة بنجاح.', 'info');
        },
        onError: (err: Error) => addToast(`فشل حذف الخدمة: ${err.message}`, 'error'),
    });

    return { 
        createPackage, 
        updatePackage, 
        deletePackage,
        createStandaloneService,
        updateStandaloneService,
        deleteStandaloneService,
        createComparisonItem,
        updateComparisonItem,
        deleteComparisonItem
    };
};
