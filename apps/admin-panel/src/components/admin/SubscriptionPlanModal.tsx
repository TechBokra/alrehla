
import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import type { SubscriptionPlan } from '../../lib/database.types';
import { Button } from '@alrehla/ui/button';
import { Input } from '@alrehla/ui/input';
import FormField from '@alrehla/ui/form-field';
import Modal from '@alrehla/ui/modal';

interface SubscriptionPlanFormValues {
    id?: number;
    name: string;
    duration_months: number;
    price: number;
    price_per_month: number;
    savings_text: string;
    is_best_value: boolean;
}

interface SubscriptionPlanModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (payload: SubscriptionPlanFormValues) => void;
    isSaving: boolean;
    planToEdit: SubscriptionPlan | null;
}

export const SubscriptionPlanModal: React.FC<SubscriptionPlanModalProps> = ({ isOpen, onClose, onSave, isSaving, planToEdit }) => {
    const [name, setName] = useState('');
    const [duration, setDuration] = useState('');
    const [price, setPrice] = useState('');
    const [pricePerMonth, setPricePerMonth] = useState('');
    const [savings, setSavings] = useState('');
    const [isBestValue, setIsBestValue] = useState(false);
    
    useEffect(() => {
        if (isOpen) {
            if (planToEdit) {
                setName(planToEdit.name);
                setDuration(planToEdit.duration_months.toString());
                setPrice(planToEdit.price.toString());
                setPricePerMonth(planToEdit.price_per_month.toString());
                setSavings(planToEdit.savings_text || '');
                setIsBestValue(planToEdit.is_best_value || false);
            } else {
                setName('');
                setDuration('');
                setPrice('');
                setPricePerMonth('');
                setSavings('');
                setIsBestValue(false);
            }
        }
    }, [isOpen, planToEdit]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload: SubscriptionPlanFormValues = {
            id: planToEdit?.id,
            name,
            duration_months: parseInt(duration) || 0,
            price: parseFloat(price) || 0,
            price_per_month: parseFloat(pricePerMonth) || 0,
            savings_text: savings,
            is_best_value: isBestValue,
        };
        onSave(payload);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={planToEdit ? 'تعديل الباقة' : 'إضافة باقة جديدة'}
            footer={
                <>
                    <Button type="button" onClick={onClose} disabled={isSaving} variant="ghost">إلغاء</Button>
                    <Button type="submit" form="plan-form" loading={isSaving} icon={<Save />}>
                        {isSaving ? 'جاري الحفظ...' : 'حفظ'}
                    </Button>
                </>
            }
        >
                <form id="plan-form" onSubmit={handleSubmit} className="space-y-6">
                    <FormField label="اسم الباقة*" htmlFor="name">
                        <Input id="name" type="text" value={name} onChange={e => setName(e.target.value)} required />
                    </FormField>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <FormField label="المدة (بالأشهر)*" htmlFor="duration">
                            <Input id="duration" type="number" value={duration} onChange={e => setDuration(e.target.value)} required />
                        </FormField>
                         <FormField label="السعر الإجمالي (ج.م)*" htmlFor="price">
                            <Input id="price" type="number" value={price} onChange={e => setPrice(e.target.value)} required />
                        </FormField>
                    </div>
                     <FormField label="السعر المحسوب شهرياً (ج.م)*" htmlFor="pricePerMonth">
                        <Input id="pricePerMonth" type="number" value={pricePerMonth} onChange={e => setPricePerMonth(e.target.value)} required />
                    </FormField>
                     <FormField label="نص التوفير (اختياري)" htmlFor="savings">
                        <Input id="savings" type="text" value={savings} onChange={e => setSavings(e.target.value)} placeholder="مثال: وفر 15%" />
                    </FormField>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" checked={isBestValue} onChange={e => setIsBestValue(e.target.checked)} id="isBestValue-checkbox" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                        <label htmlFor="isBestValue-checkbox" className="text-sm font-medium text-gray-700">علامة "الأفضل قيمة"</label>
                    </div>
                </form>
        </Modal>
    );
};
