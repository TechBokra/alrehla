import React, { useState } from 'react';
import { CheckCircle, Star } from 'lucide-react';
import Modal from '@alrehla/ui/modal';
import { Button } from '@alrehla/ui/button';
import { Textarea } from '@alrehla/ui/textarea';
import FormField from '@alrehla/ui/form-field';
import { useBookingMutations } from '../../hooks/mutations/useBookingMutations';
import { useGamificationMutations } from '../../hooks/mutations/useGamificationMutations';
import { usePublicData } from '../../hooks/queries/public/usePublicDataQuery';
import { Select } from '@alrehla/ui/native-select';
import { useToast } from '../../contexts/ToastContext';

interface SessionReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    session: any;
}

const SessionReportModal: React.FC<SessionReportModalProps> = ({ isOpen, onClose, session }) => {
    const { updateBookingProgressNotes } = useBookingMutations();
    const { awardBadge } = useGamificationMutations();
    const { data: publicData } = usePublicData();
    const { addToast } = useToast();
    const [notes, setNotes] = useState('');
    const [selectedBadgeId, setSelectedBadgeId] = useState<string>('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            await updateBookingProgressNotes.mutateAsync({
                bookingId: session.booking_id,
                notes: notes
            });

            if (selectedBadgeId) {
                try {
                    await awardBadge.mutateAsync({
                        childId: session.child_id,
                        badgeId: parseInt(selectedBadgeId),
                        instructorId: session.instructor_id
                    });
                } catch (badgeError) {
                    console.warn("Could not award badge:", badgeError);
                    addToast('تم حفظ الملاحظات، ولكن تعذر منح الشارة.', 'warning');
                }
            } else {
                addToast('تم حفظ التقرير بنجاح.', 'success');
            }

            onClose();
        } catch (error) {
            // Error already handled
        }
    };

    const badges = (publicData as any)?.badges || [];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`تقرير الجلسة: ${session.child_name || 'الطالب'}`}
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>إلغاء</Button>
                    <Button onClick={handleSubmit} loading={updateBookingProgressNotes.isPending} icon={<CheckCircle />}>
                        حفظ وإتمام الجلسة
                    </Button>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-xl text-blue-800 text-xs font-semibold">
                    هذا التقرير سيظهر لولي الأمر في لوحة التحكم الخاصة به لمتابعة تقدم طفله.
                </div>

                <FormField label="ملاحظات حول أداء الطالب" htmlFor="notes">
                    <Textarea 
                        id="notes"
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="ما هي نقاط القوة التي أظهرها الطالب اليوم؟ وما الذي يحتاج للعمل عليه؟"
                        rows={5}
                        required
                    />
                </FormField>

                <div className="border-t pt-4">
                    <FormField label="منح شارة تشجيعية (اختياري)" htmlFor="badge">
                        <div className="flex items-center gap-3">
                            <Star className="text-yellow-500 shrink-0" />
                            <Select 
                                id="badge" 
                                value={selectedBadgeId} 
                                onChange={e => setSelectedBadgeId(e.target.value)}
                            >
                                <option value="">-- بدون شارة --</option>
                                {badges.map((b: any) => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </Select>
                        </div>
                    </FormField>
                </div>
            </form>
        </Modal>
    );
};

export default SessionReportModal;
