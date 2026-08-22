import React, { useState, useMemo } from 'react';
import { Save, Plus, Trash2, Calendar, Star, Info, CheckCircle } from 'lucide-react';
import { useInstructorMutations } from '../../hooks/mutations/useInstructorMutations';
import type { Instructor, AvailableSlots } from '../../lib/database.types';
import { Button } from '@alrehla/ui/button';
import { DatePicker } from '@alrehla/ui/date-picker';
import { Select } from '@alrehla/ui/native-select';
import { Card, CardContent } from '@alrehla/ui/card';

const timeSlots = Array.from({ length: 15 }, (_, i) => {
    const hour = (i + 8).toString().padStart(2, '0');
    return `${hour}:00`;
});

const IntroductoryAvailabilityManager: React.FC<{ instructor: Instructor }> = ({ instructor }) => {
    const { requestIntroAvailabilityChange } = useInstructorMutations();
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [selectedTime, setSelectedTime] = useState('17:00');
    
    const [availability, setAvailability] = useState<AvailableSlots>(() => {
        const raw = (instructor.intro_availability as AvailableSlots) || {};
        const cleaned: AvailableSlots = {};
        Object.keys(raw).forEach(date => {
            const slots = raw[date];
            if (Array.isArray(slots)) {
                cleaned[date] = Array.from(new Set(slots))
                    .filter(t => t.endsWith(':00'))
                    .sort();
            }
        });
        return cleaned;
    });

    const handleAddTime = () => {
        if (!selectedDate || !selectedTime) return;
        setAvailability(prev => {
            const daySlots = prev[selectedDate] || [];
            if (daySlots.includes(selectedTime)) return prev;
            return { ...prev, [selectedDate]: [...daySlots, selectedTime].sort() };
        });
    };

    const handleRemoveTime = (date: string, time: string) => {
        setAvailability(prev => {
            const daySlots = (prev[date] || []).filter(t => t !== time);
            const newState = { ...prev };
            if (daySlots.length === 0) {
                delete newState[date];
            } else {
                newState[date] = daySlots;
            }
            return newState;
        });
    };

    const handleSave = () => {
        const finalAvailability: AvailableSlots = {};
        Object.keys(availability).forEach(date => {
            if (Array.isArray(availability[date]) && availability[date].length > 0) {
                finalAvailability[date] = Array.from(new Set(availability[date]))
                    .filter(t => t.endsWith(':00'))
                    .sort();
            }
        });
        requestIntroAvailabilityChange.mutate({ instructorId: instructor.id, availability: finalAvailability });
    };

    const sortedDates = useMemo(() => {
        return Object.keys(availability)
            .filter(d => new Date(d) >= new Date(new Date().setHours(0,0,0,0)))
            .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    }, [availability]);

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 flex items-start gap-3">
                <Star className="text-amber-600 mt-1 flex-shrink-0" />
                <div>
                    <h4 className="font-bold text-amber-900 text-sm">مواعيد الجلسات التعريفية المتاحة للجمهور</h4>
                    <p className="text-xs text-amber-700 mt-0.5">
                        هذه المواعيد تظهر للطلاب الجدد لحجز الجلسة التعريفية (مدة الجلسة 60 دقيقة كاملة). اختر تواريخ وساعات محددة.
                    </p>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-wrap gap-4 items-end">
                <div className="w-full sm:w-48">
                    <label className="text-xs font-bold text-gray-700 block mb-1">اختر التاريخ</label>
                    <DatePicker 
                        value={selectedDate} 
                        onChange={(date) => setSelectedDate(date)} 
                        min={new Date().toISOString().split('T')[0]}
                    />
                </div>
                <div className="w-full sm:w-40">
                    <label className="text-xs font-bold text-gray-700 block mb-1">اختر الساعة</label>
                    <Select value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)}>
                        {timeSlots.map(t => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </Select>
                </div>
                <Button type="button" onClick={handleAddTime} icon={<Plus />} variant="outline">
                    إضافة موعد
                </Button>
            </div>

            <div className="space-y-3">
                <h4 className="font-bold text-sm text-gray-700">المواعيد المحددة الحالية:</h4>
                {sortedDates.length === 0 ? (
                    <p className="text-sm text-gray-400 p-4 border rounded-xl text-center bg-gray-50">لا توجد مواعيد تعريفية مضافة حالياً.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {sortedDates.map(date => (
                            <Card key={date} className="p-3 border shadow-sm">
                                <CardContent className="p-0">
                                    <div className="flex justify-between items-center mb-2 border-b pb-1">
                                        <span className="font-bold text-xs flex items-center gap-1.5 text-blue-700">
                                            <Calendar size={14} /> {date}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {(availability[date] || []).map(time => (
                                            <span key={time} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-800 border border-blue-100 font-mono">
                                                {time}
                                                <button type="button" onClick={() => handleRemoveTime(date, time)} className="text-red-400 hover:text-red-600">
                                                    <Trash2 size={12} />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex justify-end pt-4 border-t">
                <Button onClick={handleSave} loading={requestIntroAvailabilityChange.isPending} icon={<Save />} size="lg">
                    حفظ مواعيد الجلسات التعريفية
                </Button>
            </div>
        </div>
    );
};

export default IntroductoryAvailabilityManager;
