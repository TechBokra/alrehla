import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@alrehla/ui/button';
import FormField from '@alrehla/ui/form-field';
import { Textarea } from '@alrehla/ui/textarea';
import Modal from '@alrehla/ui/modal';
import { useFinancialsMutations } from '../../hooks/mutations/useFinancialsMutations';
import { Input } from '@alrehla/ui/input';

interface PayoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    instructor: { id: number; name: string };
    amount: number;
}

const PayoutModal: React.FC<PayoutModalProps> = ({ isOpen, onClose, instructor, amount }) => {
    const { createPayout } = useFinancialsMutations();
    const [details, setDetails] = useState('');
    const [payoutAmount, setPayoutAmount] = useState(amount);

    useEffect(() => {
        if (isOpen) {
            const month = new Date().toLocaleString('ar-EG', { month: 'long' });
            const year = new Date().getFullYear();
            setDetails(`مستحقات شهر ${month} ${year}`);
            setPayoutAmount(amount);
        }
    }, [isOpen, amount]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createPayout.mutate(
            { instructorId: instructor.id, amount: payoutAmount, details },
            { onSuccess: () => onClose() }
        );
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`تسجيل دفعة للمدرب: ${instructor.name}`}
            footer={
                <>
                    <Button variant="ghost" onClick={onClose} disabled={createPayout.isPending}>إلغاء</Button>
                    <Button form="payout-form" type="submit" loading={createPayout.isPending}>
                        تسجيل الدفعة
                    </Button>
                </>
            }
        >
            <form id="payout-form" onSubmit={handleSubmit} className="space-y-4">
                <p>الرصيد المستحق: <strong className="font-mono">{amount.toLocaleString()} ج.م</strong>.</p>
                <FormField label="المبلغ المدفوع" htmlFor="amount">
                     <Input id="amount" type="number" value={payoutAmount} onChange={(e) => setPayoutAmount(parseFloat(e.target.value) || 0)} required />
                </FormField>
                <FormField label="التفاصيل" htmlFor="details">
                    <Textarea id="details" value={details} onChange={(e) => setDetails(e.target.value)} required />
                </FormField>
            </form>
        </Modal>
    );
};

export default PayoutModal;
