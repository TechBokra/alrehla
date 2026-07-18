"use client";


import React from 'react';
import type { Instructor } from '../../../lib/database.types';
import BookingCalendar from '../../BookingCalendar';
import { Calendar } from 'lucide-react';

interface CalendarSelectionProps {
    instructor: Instructor;
    onSelect: (date: Date, time: string) => void;
    holidays: string[];
    activeBookings: any[];
}

const CalendarSelection: React.FC<CalendarSelectionProps> = ({ instructor, onSelect, holidays, activeBookings }) => {
    
    const hasAvailability = instructor?.weekly_schedule && Object.values(instructor.weekly_schedule).some(daySlots => Array.isArray(daySlots) && daySlots.length > 0);

    return (
        <div className="animate-fadeIn">
            {hasAvailability ? (
                <>
                    <p className="text-muted-foreground mb-4">
                        اختر الموعد المناسب لك من المواعيد المتاحة للمدرب <span className="font-bold text-foreground">{instructor.name}</span>.
                    </p>
                    <BookingCalendar 
                        instructor={instructor} 
                        onDateTimeSelect={onSelect} 
                        holidays={holidays} 
                        activeBookings={activeBookings}
                    />
                </>
            ) : (
                 <div className="text-center py-10 px-6 bg-yellow-50 border-2 border-dashed border-yellow-300 rounded-2xl">
                    <Calendar className="mx-auto h-12 w-12 text-yellow-500" />
                    <h3 className="mt-2 text-lg font-bold text-yellow-800">لا توجد مواعيد متاحة حالياً</h3>
                    <p className="mt-1 text-sm text-yellow-700">
                        عذراً، لا توجد أوقات متاحة لهذا المدرب في الوقت الحالي. يرجى المحاولة مرة أخرى لاحقاً أو اختيار مدرب آخر.
                    </p>
                </div>
            )}
        </div>
    );
};

export default CalendarSelection;
