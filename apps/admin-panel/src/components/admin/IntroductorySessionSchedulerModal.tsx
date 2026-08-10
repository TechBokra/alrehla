import React, { useState, useEffect } from 'react';
import { Save, Calendar } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useSchedulingMutations } from '../../hooks/mutations/useSchedulingMutations';
import { useAdminInstructors } from '../../hooks/queries/admin/useAdminInstructorsQuery';
import type { Instructor } from '../../lib/database.types';
import { Button } from '@alrehla/ui/button';
import FormField from '@alrehla/ui/form-field';
import { Input } from '@alrehla/ui/input';
import { DatePicker } from '@alrehla/ui/date-picker';
import { Select } from '@alrehla/ui/native-select';
import Modal from '@alrehla/ui/modal';

interface IntroductorySessionSchedulerModalProps {
    isOpen: boolean;
    onClose: () => void;
    instructor?: Instructor | null;
}

const IntroductorySessionSchedulerModal: React.FC<IntroductorySessionSchedulerModalProps> = ({ isOpen, onClose, instructor }) => {
    const { addToast } = useToast();
    const { scheduleIntroductorySession } = useSchedulingMutations();
    const { data: instructors = [], isLoading: instructorsLoading } = useAdminInstructors();

    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [selectedInstructorId, setSelectedInstructorId] = useState<string>('');
    
    const isSaving = scheduleIntroductorySession.isPending;

    useEffect(() => {
        if (isOpen) {
            setDate(new Date().toISOString().split('T')[0]);
            setTime('17:00');
            setSelectedInstructorId(instructor?.id.toString() || '');
        }
    }, [isOpen, instructor]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const instructorId = instructor?.id || parseInt(selectedInstructorId);
        if (!instructorId) {
            addToast('يرجى اختيار مدرب.', 'warning');
            return;
        }
        if (!date || !time) {
            addToast('يرجى تحديد التاريخ والوقت.', 'warning');
            return;
        }
        try {
            await scheduleIntroductorySession.mutateAsync({
                instructorId,
                date,
                time,
            });
            onClose();
        } catch (error) {
            // Error handled by hook
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={instructor ? `جدولة جلسة للمدرب: ${instructor.name}` : 'جدولة جلسة تعريفية جديدة'}
            footer={
                <>
                    <Button type="button" onClick={onClose} disabled={isSaving} variant="ghost">إلغاء</Button>
                    <Button type="submit" form="scheduler-form" loading={isSaving} icon={<Calendar />}>
                        {isSaving ? 'جاري الجدولة...' : 'تأكيد الجدولة'}
                    </Button>
                </>
            }
        >
            <form id="scheduler-form" onSubmit={handleSubmit} className="space-y-6">
                <p className="text-muted-foreground">اختر المدرب والتاريخ والوقت لجدولة الجلسة التعريفية المجانية.</p>
                
                {!instructor && (
                    <FormField label="اختر المدرب" htmlFor="instructor-select">
                        <Select id="instructor-select" value={selectedInstructorId} onChange={e => setSelectedInstructorId(e.target.value)} disabled={instructorsLoading} required>
                            <option value="">-- اختر --</option>
                            {instructors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                        </Select>
                    </FormField>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField label="التاريخ" htmlFor="session-date">
                        <DatePicker id="session-date" value={date} onChange={setDate} required />
                    </FormField>
                    <FormField label="الوقت" htmlFor="session-time">
                        <Input type="time" id="session-time" value={time} onChange={e => setTime(e.target.value)} required />
                    </FormField>
                </div>
            </form>
        </Modal>
    );
};

export default IntroductorySessionSchedulerModal;
