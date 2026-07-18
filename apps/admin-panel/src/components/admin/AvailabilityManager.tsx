
import React, { useState, useEffect } from 'react';
import { Loader2, Save } from 'lucide-react';
import { useAdminInstructors } from '../../hooks/queries/admin/useAdminInstructorsQuery';
import { useInstructorMutations } from '../../hooks/mutations/useInstructorMutations';
import type { Instructor, AvailableSlots } from '../../lib/database.types';
import { Select } from '@alrehla/ui/native-select';
import { Button } from '@alrehla/ui/button';

// تعديل المواعيد لتكون كل ساعة بدلاً من كل نصف ساعة
const timeSlots = Array.from({ length: 15 }, (_, i) => {
    const hour = (i + 8).toString().padStart(2, '0'); // من 08:00 صباحاً إلى 22:00 مساءً
    return `${hour}:00`;
});

const AvailabilityManager: React.FC = () => {
    const { data: instructors = [], isLoading: instructorsLoading } = useAdminInstructors();
    const { updateInstructorAvailability } = useInstructorMutations();

    const [selectedInstructorId, setSelectedInstructorId] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [availability, setAvailability] = useState<AvailableSlots>({});
    
    const instructor = instructors.find(i => i.id === parseInt(selectedInstructorId));

    useEffect(() => {
        if (instructor?.availability) {
            setAvailability(instructor.availability as AvailableSlots);
        } else {
            setAvailability({});
        }
    }, [instructor]);
    
    const handleTimeToggle = (time: string) => {
        setAvailability(prev => {
            const daySlots = prev[selectedDate] || [];
            const newDaySlots = daySlots.includes(time)
                ? daySlots.filter(t => t !== time)
                : [...daySlots, time].sort();
            return { ...prev, [selectedDate]: newDaySlots };
        });
    };
    
    const handleSave = () => {
        if (!instructor) return;
        updateInstructorAvailability.mutate({ instructorId: instructor.id, availability });
    };

    if (instructorsLoading) {
        return <Loader2 className="animate-spin" />;
    }

    const currentDaySlots = availability[selectedDate] || [];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <Select value={selectedInstructorId} onChange={e => setSelectedInstructorId(e.target.value)}>
                    <option value="">-- اختر مدرب --</option>
                    {instructors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </Select>
                <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-full p-2 border rounded-lg bg-white" />
            </div>

            {selectedInstructorId && (
                <div>
                    <h4 className="font-bold mb-3">المواعيد المتاحة لـ {instructor?.name} في يوم {selectedDate} (نظام 60 دقيقة)</h4>
                     <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                         {timeSlots.map(time => {
                             const isSelected = currentDaySlots.includes(time);
                             return (
                                <button
                                    key={time}
                                    onClick={() => handleTimeToggle(time)}
                                    className={`p-2 border rounded-lg text-xs font-mono font-bold transition-colors ${
                                        isSelected ? 'bg-blue-600 text-white' : 'bg-white hover:bg-blue-100'
                                    }`}
                                >
                                    {time}
                                </button>
                             );
                         })}
                    </div>
                    <div className="flex justify-end mt-6">
                        <Button onClick={handleSave} loading={updateInstructorAvailability.isPending} icon={<Save />}>
                            حفظ المواعيد المعدلة
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AvailabilityManager;
