import React, { useState } from 'react';
import { Send, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@alrehla/ui/button';
import { Textarea } from '@alrehla/ui/textarea';
import { DatePicker } from '@alrehla/ui/date-picker';
import FormField from '@alrehla/ui/form-field';
import { useInstructorMutations } from '../../hooks/mutations/useInstructorMutations';
import { useInstructorData } from '../../hooks/queries/instructor/useInstructorDataQuery';
import type { ScheduledSession, Instructor, WeeklySchedule } from '../../lib/database.types';
import Modal from '@alrehla/ui/modal';
import { Select } from '@alrehla/ui/native-select';

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
    const { data: instructorData } = useInstructorData();
    
    const [reason, setReason] = useState('');
    const [newDate, setNewDate] = useState('');
    const [newTime, setNewTime] = useState('');
    const [error, setError] = useState<string | null>(null);

    const isSaving = submitRescheduleRequest.isPending;

    if (!session) return null;

    const currentInstructor = instructor || instructorData?.instructor;

    const checkConflict = (dateStr: string, timeStr: string) => {
        if (!currentInstructor || !currentInstructor.weekly_schedule) return false;

        const date = new Date(dateStr);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        
        const schedule = currentInstructor.weekly_schedule as WeeklySchedule;
        const slots = schedule[dayName] || [];

        return slots.includes(timeStr);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!newDate || !newTime || !reason) {
            setError('يرجى ملء كافة الحقول المطلوبة.');
            return;
        }

        if (checkConflict(newDate, newTime)) {
            setError('عذراً، هذا الموعد محجوز للحجوزات التلقائية في جدولك الأساسي. يرجى اختيار موعد استثنائي خارج أوقات عملك المعتادة.');
            return;
        }
        
        await submitRescheduleRequest.mutateAsync({
            sessionId: session.id,
            oldDate: session.session_date,
            newDate: newDate,
            newTime: newTime,
            reason: reason,
            instructorName: currentInstructor?.name || 'المدرب'
        });
        
        onClose();
        setReason('');
        setNewDate('');
        setNewTime('');
        setError(null);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="طلب تغيير موعد جلسة"
            footer={
                <>
                    <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving}>إلغاء</Button>
                    <Button form="request-change-form" type="submit" loading={isSaving} icon={<Send size={16}/>}>إرسال الطلب للإدارة</Button>
                </>
            }
        >
            <form id="request-change-form" onSubmit={handleSubmit} className="space-y-5">
                <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800 mb-4">
                    <p>أنت تطلب تعديل الجلسة الحالية للطالب: <span className="font-bold">{childName}</span></p>
                    <p className="text-xs mt-1 opacity-80">الموعد الحالي: {new Date(session.session_date).toLocaleString('ar-EG')}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="الموعد الجديد المقترح" htmlFor="newDate">
                        <DatePicker
                            id="newDate"
                            value={newDate} 
                            onChange={date => { setNewDate(date); setError(null); }}
                            min={new Date().toISOString().split('T')[0]} 
                            required 
                        />
                    </FormField>
                    <FormField label="التوقيت" htmlFor="newTime">
                        <Select 
                            id="newTime" 
                            value={newTime} 
                            onChange={e => { setNewTime(e.target.value); setError(null); }} 
                            required
                        >
                            <option value="">-- اختر --</option>
                            {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                        </Select>
                    </FormField>
                </div>

                <FormField label="سبب التغيير (إلزامي)" htmlFor="reason">
                    <Textarea 
                        id="reason" 
                        value={reason} 
                        onChange={e => setReason(e.target.value)} 
                        rows={3} 
                        required 
                        placeholder="يرجى توضيح سبب طلب التغيير بالتفصيل..." 
                    />
                </FormField>

                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-sm text-red-700 animate-fadeIn">
                        <AlertTriangle className="shrink-0 mt-0.5" size={16} />
                        <span>{error}</span>
                    </div>
                )}
                
                <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
                    <p>ملاحظة: يجب أن يكون الموعد المقترح <strong>خارج أوقات جدولك الأسبوعي الثابت</strong> لتجنب التعارض مع الحجوزات التلقائية للعملاء الآخرين.</p>
                </div>
            </form>
        </Modal>
    );
};

export default RequestSessionChangeModal;
