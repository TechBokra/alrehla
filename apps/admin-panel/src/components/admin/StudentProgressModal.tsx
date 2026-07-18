import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { useBookingMutations } from '../../hooks/mutations/useBookingMutations';
import type { CreativeWritingBooking } from '../../lib/database.types';
import { useToast } from '../../contexts/ToastContext';
import { formatDate } from '../../utils/helpers';
import Modal from '@alrehla/ui/modal';
import { Button } from '@alrehla/ui/button';
import { Textarea } from '@alrehla/ui/textarea';
import FormField from '@alrehla/ui/form-field';
import { Card, CardContent, CardHeader, CardTitle } from '@alrehla/ui/card';

interface Student {
    id: number;
    name: string;
    bookings: CreativeWritingBooking[];
    lastProgressNote: string | null;
}

interface StudentProgressModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: Student | null;
}

export const StudentProgressModal: React.FC<StudentProgressModalProps> = ({ isOpen, onClose, student }) => {
    const { updateBookingProgressNotes } = useBookingMutations();
    const { addToast } = useToast();
    const [notes, setNotes] = useState<{ [bookingId: string]: string }>({});
    
    const isSaving = updateBookingProgressNotes.isPending;

    useEffect(() => {
        if (student) {
            const initialNotes: { [bookingId: string]: string } = {};
            student.bookings.forEach(b => {
                initialNotes[b.id] = b.progress_notes || '';
            });
            setNotes(initialNotes);
        }
    }, [student, isOpen]);

    if (!student) return null;

    const handleNoteChange = (bookingId: string, text: string) => {
        setNotes(prev => ({ ...prev, [bookingId]: text }));
    };

    const handleSave = async () => {
        try {
            const updatePromises = student.bookings
                .filter(b => notes[b.id] !== (b.progress_notes || ''))
                .map(b => updateBookingProgressNotes.mutateAsync({ bookingId: b.id, notes: notes[b.id] }));
            
            await Promise.all(updatePromises);
            addToast('تم حفظ ملاحظات التقدم بنجاح.', 'success');
            onClose();
        } catch (error) {
            console.error(error);
        }
    };

    const completedSessions = student.bookings
        .filter(b => b.status === 'مكتمل')
        .sort((a, b) => new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime());

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`ملاحظات التقدم للطالب: ${student.name}`}
            size="2xl"
            footer={
                <>
                    <Button type="button" onClick={onClose} variant="ghost" disabled={isSaving}>إلغاء</Button>
                    <Button onClick={handleSave} loading={isSaving} icon={<Save />}>
                        {isSaving ? 'جاري الحفظ...' : 'حفظ الملاحظات'}
                    </Button>
                </>
            }
        >
            <div className="space-y-6">
                {completedSessions.length > 0 ? completedSessions.map(booking => (
                    <Card key={booking.id}>
                        <CardHeader>
                            <CardTitle className="text-lg">جلسة تاريخ: {formatDate(booking.booking_date)}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <FormField label="ملاحظاتك" htmlFor={`notes-${booking.id}`}>
                                <Textarea
                                    id={`notes-${booking.id}`}
                                    value={notes[booking.id] || ''}
                                    onChange={(e) => handleNoteChange(booking.id, e.target.value)}
                                    rows={4}
                                    placeholder="اكتب ملاحظاتك حول تقدم الطالب في هذه الجلسة..."
                                    disabled={isSaving}
                                />
                            </FormField>
                        </CardContent>
                    </Card>
                )) : (
                    <p className="text-center text-muted-foreground py-8">لا توجد جلسات مكتملة لهذا الطالب بعد.</p>
                )}
            </div>
        </Modal>
    );
};