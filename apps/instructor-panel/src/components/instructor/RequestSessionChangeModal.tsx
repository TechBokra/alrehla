import React, { useMemo } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@alrehla/ui/button';
import {
    FormError,
    FormSubmitButton,
    useAppForm,
    zodFormOptions,
} from '@alrehla/forms';
import { useInstructorMutations } from '../../hooks/mutations/useInstructorMutations';
import { useInstructorProfileQuery } from '../../hooks/queries/instructor/useInstructorProfileQuery';
import type { ScheduledSession, Instructor, WeeklySchedule } from '../../lib/database.types';
import Modal from '@alrehla/ui/modal';
import {
    createRequestSessionChangeSchema,
    requestSessionChangeDefaultValues,
} from './request-session-change.schema';

interface RequestSessionChangeModalProps {
    isOpen: boolean;
    onClose: () => void;
    session: ScheduledSession | null;
    childName?: string | null;
    instructor?: Instructor | null;
}

const timeSlots = Array.from({ length: 15 }, (_, i) => {
    const hour = (i + 8).toString().padStart(2, '0');
    return `${hour}:00`;
});

const RequestSessionChangeModal: React.FC<RequestSessionChangeModalProps> = ({ isOpen, onClose, session, childName, instructor }) => {
    const { submitRescheduleRequest } = useInstructorMutations();
    const { data: fetchedInstructor } = useInstructorProfileQuery();
    
    const currentInstructor = instructor || fetchedInstructor;

    const checkConflict = (dateStr: string, timeStr: string) => {
        if (!currentInstructor || !currentInstructor.weekly_schedule) return false;

        const date = new Date(dateStr);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        
        const schedule = currentInstructor.weekly_schedule as WeeklySchedule;
        const slots = schedule[dayName] || [];

        return slots.includes(timeStr);
    };

    const schema = useMemo(
        () => createRequestSessionChangeSchema(checkConflict),
        [currentInstructor],
    );

    const form = useAppForm({
        ...zodFormOptions(schema),
        defaultValues: requestSessionChangeDefaultValues,
        onSubmit: async ({ formApi, value }) => {
            if (!session) return;

            await submitRescheduleRequest.mutateAsync({
                sessionId: session.id,
                oldDate: session.session_date,
                newDate: value.newDate,
                newTime: value.newTime,
                reason: value.reason,
                instructorName: currentInstructor?.name || 'المدرب',
            });

            formApi.reset();
            onClose();
        },
    });

    const handleClose = () => {
        form.reset();
        onClose();
    };

    if (!session) return null;

    return (
        <form.AppForm>
            <Modal
                isOpen={isOpen}
                onClose={handleClose}
                title="طلب تغيير موعد جلسة"
                footer={
                    <>
                        <form.Subscribe selector={(state) => state.isSubmitting}>
                            {(isSubmitting) => (
                                <Button type="button" variant="ghost" onClick={handleClose} disabled={isSubmitting}>إلغاء</Button>
                            )}
                        </form.Subscribe>
                        <FormSubmitButton form="request-change-form" icon={<Send size={16}/>}>إرسال الطلب للإدارة</FormSubmitButton>
                    </>
                }
            >
            <form
                id="request-change-form"
                onSubmit={(event) => {
                    event.preventDefault();
                    void form.handleSubmit();
                }}
                className="flex flex-col gap-5"
            >
                <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800 mb-4">
                    <p>أنت تطلب تعديل الجلسة الحالية للطالب: <span className="font-bold">{childName}</span></p>
                    <p className="text-xs mt-1 opacity-80">الموعد الحالي: {new Date(session.session_date).toLocaleString('ar-EG')}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <form.AppField name="newDate">
                        {(field) => (
                            <field.DateField
                            label="الموعد الجديد المقترح"
                            min={new Date().toISOString().split('T')[0]} 
                            required 
                            />
                        )}
                    </form.AppField>
                    <form.AppField name="newTime">
                        {(field) => (
                            <field.SelectField label="التوقيت" required>
                                <option value="">-- اختر --</option>
                                {timeSlots.map((time) => <option key={time} value={time}>{time}</option>)}
                            </field.SelectField>
                        )}
                    </form.AppField>
                </div>

                <form.AppField name="reason">
                    {(field) => (
                        <field.TextareaField
                            label="سبب التغيير (إلزامي)"
                            placeholder="يرجى توضيح سبب طلب التغيير بالتفصيل..."
                            required
                            rows={3}
                        />
                    )}
                </form.AppField>

                <FormError />
                
                <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
                    <p>ملاحظة: يجب أن يكون الموعد المقترح <strong>خارج أوقات جدولك الأسبوعي الثابت</strong> لتجنب التعارض مع الحجوزات التلقائية للعملاء الآخرين.</p>
                </div>
            </form>
            </Modal>
        </form.AppForm>
    );
};

export default RequestSessionChangeModal;
