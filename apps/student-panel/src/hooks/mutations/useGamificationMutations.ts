
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../contexts/ToastContext';
import { gamificationService } from '../../services/gamificationService';

export const useGamificationMutations = () => {
    const queryClient = useQueryClient();
    const { addToast } = useToast();

    const awardBadge = useMutation({
        mutationFn: gamificationService.awardBadge,
        onSuccess: () => {
            // تحديث كافة القوائم المرتبطة بالشارات فوراً
            queryClient.invalidateQueries({ queryKey: ['studentDashboardData'] });
            queryClient.invalidateQueries({ queryKey: ['userAccountData'] });
            queryClient.invalidateQueries({ queryKey: ['trainingJourney'] });
            
            addToast('تم منح الشارة للطالب بنجاح! 🏆 وجهودكم كمدربين محل تقدير.', 'success');
        },
        onError: (err: Error) => {
            addToast(`عذراً، فشل منح الشارة: ${err.message}`, 'error');
        }
    });

    return { awardBadge };
};
