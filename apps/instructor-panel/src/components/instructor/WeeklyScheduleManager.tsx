import React, { useState, useEffect } from 'react';
import { Send, Clock } from 'lucide-react';
import { useInstructorMutations } from '../../hooks/mutations/useInstructorMutations';
import type { Instructor, WeeklySchedule } from '../../lib/database.types';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '@alrehla/ui/button';

const daysOfWeek = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const dayNames: { [key: string]: string } = {
    saturday: 'السبت', sunday: 'الأحد', monday: 'الاثنين', tuesday: 'الثلاثاء', wednesday: 'الأربعاء',
    thursday: 'الخميس', friday: 'الجمعة'
};

const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return `${hour}:00`;
});

export const WeeklyScheduleManager: React.FC<{ instructor: Instructor }> = ({ instructor }) => {
    const { requestScheduleChange } = useInstructorMutations();
    const { addToast } = useToast();
    const [schedule, setSchedule] = useState<WeeklySchedule>({});

    useEffect(() => {
        if (instructor.weekly_schedule) {
            const rawSchedule = instructor.weekly_schedule as WeeklySchedule;
            const cleanedSchedule: WeeklySchedule = {};
            
            Object.keys(rawSchedule).forEach(day => {
                if (Array.isArray(rawSchedule[day])) {
                    cleanedSchedule[day] = Array.from(new Set(rawSchedule[day])).sort();
                }
            });
            
            setSchedule(cleanedSchedule);
        } else {
            setSchedule({});
        }
    }, [instructor.id, instructor.weekly_schedule]);

    const handleTimeToggle = (day: string, time: string) => {
        setSchedule(prev => {
            const currentSlots = prev[day] || [];
            let newSlots: string[];

            if (currentSlots.includes(time)) {
                newSlots = currentSlots.filter(t => t !== time);
            } else {
                newSlots = Array.from(new Set([...currentSlots, time])).sort();
            }
            
            const newSchedule = { ...prev, [day]: newSlots };
            
            if (newSlots.length === 0) {
                const { [day]: _, ...rest } = newSchedule;
                return rest;
            }

            return newSchedule;
        });
    };
    
    const handleSubmit = () => {
        const hasSlots = Object.values(schedule).some(v => Array.isArray(v) && v.length > 0);
        if (!hasSlots && !window.confirm("جدولك فارغ تماماً. هل تريد مسح جميع مواعيد التوفر؟")) {
            return;
        }
        requestScheduleChange.mutate({ instructorId: instructor.id, schedule });
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-start gap-3">
                <Clock className="text-blue-600 mt-1 flex-shrink-0" />
                <div>
                    <p className="text-sm font-bold text-blue-800">تعديل قالب التوفر الأسبوعي</p>
                    <p className="text-xs text-blue-700">المواعيد المختارة هنا هي مواعيدك الثابتة التي تظهر أسبوعياً. (نظام الجلسات: 60 دقيقة).</p>
                </div>
            </div>

            {daysOfWeek.map(day => {
                const daySlots = schedule[day] || [];
                return (
                    <div key={day} className="bg-white p-4 rounded-xl border shadow-sm hover:border-blue-200 transition-colors">
                        <h4 className="font-bold mb-4 text-gray-700 border-b pb-2 flex justify-between items-center">
                            {dayNames[day]}
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${daySlots.length > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>
                                {daySlots.length} مواعيد
                            </span>
                        </h4>
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2">
                            {timeSlots.map(time => {
                                const isSelected = daySlots.includes(time);
                                return (
                                    <button
                                        key={time}
                                        type="button"
                                        onClick={() => handleTimeToggle(day, time)}
                                        className={`p-2 border rounded-lg text-xs font-mono font-bold transition-all duration-200 ${
                                            isSelected 
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105' 
                                            : 'bg-gray-50 text-gray-400 hover:bg-white hover:text-blue-600 hover:border-blue-300'
                                        }`}
                                    >
                                        {time}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
             <div className="flex justify-end mt-6 sticky bottom-4 z-10">
                <Button onClick={handleSubmit} loading={requestScheduleChange.isPending} icon={<Send />} size="lg" className="shadow-2xl">
                    إرسال الجدول للمراجعة والاعتماد
                </Button>
            </div>
        </div>
    );
};
