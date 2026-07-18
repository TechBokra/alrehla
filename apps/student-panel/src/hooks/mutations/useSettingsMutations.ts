
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../contexts/ToastContext';
import { settingsService } from '../../services/settingsService';

export const useSettingsMutations = () => {
    const queryClient = useQueryClient();
    const { addToast } = useToast();

    const updateSocialLinks = useMutation({
        mutationFn: settingsService.updateSocialLinks,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminSocialLinks'] });
            queryClient.invalidateQueries({ queryKey: ['publicData'] });
            addToast('تم تحديث الروابط بنجاح.', 'success');
        },
        onError: (error: Error) => {
            addToast(`فشل تحديث الروابط: ${error.message}`, 'error');
        }
    });
    
    const updateCommunicationSettings = useMutation({
        mutationFn: settingsService.updateCommunicationSettings,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminCommunicationSettings'] });
            queryClient.invalidateQueries({ queryKey: ['publicData'] });
            addToast('تم تحديث إعدادات التواصل بنجاح.', 'success');
        },
        onError: (error: Error) => {
            addToast(`فشل تحديث الإعدادات: ${error.message}`, 'error');
        }
    });

    const updatePricingSettings = useMutation({
        mutationFn: settingsService.updatePricingSettings,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminPricingSettings'] });
            addToast('تم تحديث إعدادات التسعير بنجاح.', 'success');
        },
        onError: (error: Error) => {
            addToast(`فشل تحديث الإعدادات: ${error.message}`, 'error');
        }
    });
    
    const updateLibraryPricingSettings = useMutation({
        mutationFn: settingsService.updateLibraryPricingSettings,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminLibraryPricingSettings'] });
            addToast('تم تحديث إعدادات تسعير المكتبة بنجاح.', 'success');
        },
        onError: (error: Error) => {
            addToast(`فشل تحديث الإعدادات: ${error.message}`, 'error');
        }
    });

    const updateRolePermissions = useMutation({
        mutationFn: settingsService.updateRolePermissions,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminRolePermissions'] });
            addToast('تم تحديث صلاحيات الأدوار بنجاح.', 'success');
        },
        onError: (error: Error) => {
            addToast(`فشل تحديث الصلاحيات: ${error.message}`, 'error');
        }
    });
    
    const updateJitsiSettings = useMutation({
        mutationFn: settingsService.updateJitsiSettings,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminJitsiSettings'] });
            addToast('تم تحديث إعدادات Jitsi بنجاح.', 'success');
        },
        onError: (error: Error) => {
            addToast(`فشل تحديث الإعدادات: ${error.message}`, 'error');
        }
    });

    const updateSystemConfig = useMutation({
        mutationFn: settingsService.updateSystemConfig,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminSystemConfig'] });
            addToast('تم تحديث إعدادات النظام بنجاح. قد يتطلب الأمر تحديث الصفحة لتفعيل التغييرات الجذرية.', 'success');
        },
        onError: (error: Error) => {
            addToast(`فشل تحديث إعدادات النظام: ${error.message}`, 'error');
        }
    });

    const updateMaintenanceSettings = useMutation({
        mutationFn: settingsService.updateMaintenanceSettings,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminMaintenanceSettings'] });
            queryClient.invalidateQueries({ queryKey: ['publicData'] });
            addToast('تم تحديث إعدادات شريط التنبيه بنجاح.', 'success');
        },
        onError: (error: Error) => {
            addToast(`فشل تحديث الإعدادات: ${error.message}`, 'error');
        }
    });

    return { 
        updateSocialLinks, 
        updateCommunicationSettings, 
        updatePricingSettings, 
        updateLibraryPricingSettings,
        updateRolePermissions, 
        updateJitsiSettings,
        updateSystemConfig,
        updateMaintenanceSettings
    };
}
