import React, { useState, useEffect, useRef } from 'react';
import { Save, Calendar } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useSchedulingMutations } from '../../hooks/mutations/useSchedulingMutations';
import type { Subscription } from '../../lib/database.types';
import { Button } from '@alrehla/ui/button';
import FormField from '@alrehla/ui/form-field';
import { Input } from '@alrehla/ui/input';
import { Select } from '@alrehla/ui/native-select';
import { Textarea } from '@alrehla/ui/textarea';
import Modal from '@alrehla/ui/modal';

interface SessionSchedulerModalProps {
    isOpen: boolean;
    onClose: () => void;
    subscription: Subscription | null;
}

export const SessionSchedulerModal: React.FC<SessionSchedulerModalProps> = ({ isOpen, onClose, subscription }) => {
    const { addToast } = useToast();
    const { scheduleSubscriptionSessions } = useSchedulingMutations();

    const [dayOfWeek, setDayOfWeek] = useState('tuesday');
    const [time, setTime] = useState('17:00');
    const [startDate, setStartDate] = useState('');
    const [exceptions, setExceptions] = useState('');
    
    const isSaving = scheduleSubscriptionSessions.isPending;

    useEffect(() => {
        if (isOpen) {
            setDayOfWeek('tuesday');
            setTime('17:00');
            setStartDate(new Date().toISOString().split('T')[0]);
            setExceptions('');
        }
    }, [isOpen]);

    if (!subscription) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!startDate) {
            addToast('يرجى تحديد تاريخ بدء الجدولة.', 'warning');
            return;
        }
        try {
            await scheduleSubscriptionSessions.mutateAsync({
                subscriptionId: subscription.id,
                childId: subscription.child_id,
                schedule: { dayOfWeek, time, startDate, exceptions },
            });
            onClose();
        } catch (error) {
            // Error handled by hook
        }
    };

    const dayOptions = [
        { value: 'saturday', label: 'السبت' },
        { value: 'sunday', label: 'الأحد' },
        { value: 'monday', label: 'الاثنين' },
        { value: 'tuesday', label: 'الثلاثاء' },
        { value: 'wednesday', label: 'الأربعاء' },
        { value: 'thursday', label: 'الخميس' },
        { value: 'friday', label: 'الجمعة' },
    ];

    const timeOptions = Array.from({ length: 24 }, (_, i) => {
        const hour = i.toString().padStart(2, '0');
        return `${hour}:00`;
    });


    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="جدولة جلسات الاشتراك"
            footer={
                <>
                    <Button type="button" onClick={onClose} disabled={isSaving} variant="ghost">إلغاء</Button>
                    <Button type="submit" form="scheduler-form" loading={isSaving} icon={<Calendar />}>
                        {isSaving ? 'جاري الجدولة...' : 'جدولة الجلسات'}
                    </Button>
                </>
            }
        >
                <p className="text-muted-foreground mb-6">
                    جدولة الجلسات الأسبوعية للاشتراك الخاص بالطفل <span className="font-bold text-foreground">{subscription.child_name}</span>.
                </p>
                <form id="scheduler-form" onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField label="اليوم الأسبوعي" htmlFor="dayOfWeek">
                            <Select id="dayOfWeek" value={dayOfWeek} onChange={e => setDayOfWeek(e.target.value)}>
                                {dayOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </Select>
                        </FormField>
                        <FormField label="الوقت" htmlFor="time">
                             <Select id="time" value={time} onChange={e => setTime(e.target.value)}>
                                {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                            </Select>
                        </FormField>
                    </div>
                     <FormField label="تاريخ البدء" htmlFor="startDate">
                        <Input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} required />
                    </FormField>
                    <FormField label="استثناءات (تواريخ بصيغة YYYY-MM-DD مفصولة بفاصلة)" htmlFor="exceptions">
                        <Textarea id="exceptions" value={exceptions} onChange={e => setExceptions(e.target.value)} rows={2} placeholder="مثال: 2025-10-06, 2025-12-25" />
                    </FormField>
                </form>
        </Modal>
    );
};