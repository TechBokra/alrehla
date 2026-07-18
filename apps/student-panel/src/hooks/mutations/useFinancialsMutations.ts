
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../contexts/ToastContext';
import { financialService } from '../../services/financialService';

export const useFinancialsMutations = () => {
    const queryClient = useQueryClient();
    const { addToast } = useToast();

    const createPayout = useMutation({
        mutationFn: financialService.createPayout,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminFinancials'] });
            addToast('تم تسجيل الدفعة بنجاح.', 'success');
        },
        onError: (err: Error) => {
            addToast(`فشل تسجيل الدفعة: ${err.message}`, 'error');
        }
    });

    return { createPayout };
};
