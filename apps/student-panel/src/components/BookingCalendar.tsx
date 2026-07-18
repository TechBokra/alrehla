"use client";


import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Clock, Globe } from 'lucide-react';
import type { Instructor, WeeklySchedule } from '../lib/database.types';

interface BookingCalendarProps {
    instructor: Instructor | null;
    onDateTimeSelect: (date: Date, time: string) => void;
    holidays?: string[];
    activeBookings?: any[]; 
}

const BookingCalendar: React.FC<BookingCalendarProps> = ({ instructor, onDateTimeSelect, holidays = [], activeBookings = [] }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const weeklySchedule: WeeklySchedule = useMemo(() => {
        if (!instructor || !instructor.weekly_schedule) return {};
        return instructor.weekly_schedule as WeeklySchedule;
    }, [instructor]);

    const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    
    // Helper to get first day index (0=Sun, ..., 6=Sat)
    const getFirstDayIndex = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const monthName = currentDate.toLocaleString('ar-EG', { month: 'long' });
    const year = currentDate.getFullYear();
    const totalDays = daysInMonth(currentDate);
    
    // Adjust starting day for Saturday start (Sat=0, Sun=1, ... Fri=6)
    // Original getDay(): Sun=0, Mon=1, ..., Sat=6
    // Formula: (day + 1) % 7  => Sat(6)->0, Sun(0)->1
    const startingDay = (getFirstDayIndex(currentDate) + 1) % 7;

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
        setSelectedDate(null);
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
        setSelectedDate(null);
    };
    
    const handleDateClick = (day: number) => {
        const newSelectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const minDate = new Date();
        minDate.setDate(minDate.getDate() + 7);
        minDate.setHours(0, 0, 0, 0);

        if (newSelectedDate < minDate) return; 
        setSelectedDate(newSelectedDate);
    };
    
    // دالة مساعدة لاستخراج عدد الجلسات من اسم الباقة
    const getSessionCount = (packageName: string | undefined): number => {
        if (!packageName) return 1;
        // استخراج الرقم من النص (مثال: "باقة 4 جلسات" -> 4)
        const match = packageName.match(/(\d+)/);
        if (match && match[1]) return parseInt(match[1], 10);
        // التعامل مع النصوص العربية
        if (packageName.includes('واحدة') || packageName.includes('تعريفية')) return 1;
        if (packageName.includes('أربع') || packageName.includes('4')) return 4;
        if (packageName.includes('ثمان') || packageName.includes('8')) return 8;
        if (packageName.includes('اثني') || packageName.includes('12')) return 12;
        return 1; // الافتراضي
    };

    // ترتيب الأيام بدأً من السبت
    const dayNames = ['سبت', 'أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة'];
    const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);
    
    const availableTimes = useMemo(() => {
        if (!selectedDate || !weeklySchedule || !instructor) return [];
        
        const dayOfWeek = selectedDate.toLocaleString('en-US', { weekday: 'long' }).toLowerCase() as keyof WeeklySchedule;
        const templateSlots = weeklySchedule[dayOfWeek] || [];
        
        // استخدام مقارنة صارمة للتواريخ بتصفير الوقت
        const selectedTime = selectedDate.getTime(); 
        const selectedDateOnly = new Date(selectedTime).setHours(0,0,0,0);

        const busySlotsForDay = activeBookings
            .filter(b => {
                if (b.instructor_id !== instructor.id || b.status === 'ملغي') return false;
                
                const bookingStart = new Date(b.booking_date);
                const bookingStartOnly = new Date(bookingStart).setHours(0,0,0,0);
                
                // حساب الفرق بالأيام
                const diffTime = selectedDateOnly - bookingStartOnly;
                const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
                
                // 1. يجب أن يكون في نفس يوم الأسبوع (الفرق يقبل القسمة على 7)
                // 2. يجب أن يكون التاريخ المختار مساوياً لتاريخ الحجز أو بعده
                if (diffDays < 0 || diffDays % 7 !== 0) return false;

                // 3. يجب أن يكون ضمن عدد جلسات الباقة المحجوزة
                const totalSessions = getSessionCount(b.package_name);
                const sessionIndex = diffDays / 7; // 0 للجلسة الأولى، 1 للثانية، إلخ

                return sessionIndex < totalSessions;
            })
            .map(b => b.booking_time);

        return templateSlots.filter(time => 
            time.endsWith(':00') && !busySlotsForDay.includes(time)
        );
    }, [selectedDate, weeklySchedule, activeBookings, instructor]);

    return (
        <div className="bg-gray-50 p-6 rounded-2xl border">
            <div className="flex items-center justify-between mb-4">
                <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-gray-200"><ChevronRight size={20} /></button>
                <h3 className="font-bold text-lg">{monthName} {year}</h3>
                <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-gray-200"><ChevronLeft size={20} /></button>
            </div>

            {/* تنبيه المنطقة الزمنية */}
            <div className="mb-4 p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-3 text-[11px] text-indigo-700">
                <Globe size={16} className="shrink-0" />
                <p className="font-bold">جميع المواعيد المعروضة هي بـ <span className="underline decoration-double">توقيت مصر (القاهرة)</span>.</p>
            </div>

            <div className="mb-4 p-2 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-2 text-[10px] text-blue-700">
                <Clock size={12} />
                <span>أقرب موعد متاح هو بعد 7 أيام لضمان جودة التحضير.</span>
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-center text-sm font-semibold text-gray-500 mb-2">
                {dayNames.map(day => <div key={day}>{day}</div>)}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: startingDay }).map((_, i) => <div key={`empty-${i}`}></div>)}
                {daysArray.map(day => {
                    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                    const minAllowedDate = new Date();
                    minAllowedDate.setDate(minAllowedDate.getDate() + 7);
                    minAllowedDate.setHours(0, 0, 0, 0);

                    const isSelected = selectedDate?.toDateString() === date.toDateString();
                    const isTooSoon = date < minAllowedDate;
                    
                    const dayOfWeek = date.toLocaleString('en-US', { weekday: 'long' }).toLowerCase() as keyof WeeklySchedule;
                    const slots = weeklySchedule[dayOfWeek] || [];
                    
                    // منطق مشابه لحساب انشغال اليوم بالكامل
                    const currentDateTime = date.setHours(0,0,0,0);
                    
                    // حساب عدد المواعيد المحجوزة في هذا اليوم تحديداً
                    const busyCount = activeBookings.filter(b => {
                        if (b.instructor_id !== instructor?.id || b.status === 'ملغي') return false;
                        
                        const bookingStart = new Date(b.booking_date).setHours(0,0,0,0);
                        const diffTime = currentDateTime - bookingStart;
                        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
                        
                        if (diffDays < 0 || diffDays % 7 !== 0) return false;
                        
                        const totalSessions = getSessionCount(b.package_name);
                        return (diffDays / 7) < totalSessions;
                    }).length;
                    
                    // اليوم متاح إذا كان به قوالب (Slots) وعدد القوالب أكبر من عدد الحجوزات المتعارضة
                    const isAvailableDay = slots.some(time => time.endsWith(':00')) && (slots.filter(t => t.endsWith(':00')).length > busyCount);
                    const isHoliday = holidays.includes(date.toISOString().split('T')[0]);
                    const isDisabled = isTooSoon || !isAvailableDay || isHoliday;

                    return (
                        <button 
                            key={day}
                            onClick={() => handleDateClick(day)}
                            disabled={isDisabled}
                            className={`w-10 h-10 rounded-full text-xs transition-colors ${
                                isDisabled ? 'text-gray-300 opacity-40 cursor-not-allowed' :
                                isSelected ? 'bg-blue-600 text-white font-bold' :
                                'hover:bg-blue-100 text-gray-700 font-semibold'
                            }`}
                        >
                            {day}
                        </button>
                    );
                })}
            </div>

            {selectedDate && (
                <div className="mt-6 pt-4 border-t animate-fadeIn">
                    <h4 className="font-bold mb-3 text-sm flex justify-between items-center">
                        <span>أوقات {selectedDate.toLocaleDateString('ar-EG')} المتاحة</span>
                        <span className="text-[9px] text-muted-foreground">(توقيت مصر)</span>
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                        {availableTimes.length > 0 ? (
                            availableTimes.map(time => (
                                <button
                                    key={time}
                                    onClick={() => onDateTimeSelect(selectedDate, time)}
                                    className="p-2 border rounded-lg text-xs bg-white hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all font-bold shadow-sm"
                                >
                                    {time}
                                </button>
                            ))
                        ) : (
                            <p className="col-span-full text-center text-gray-500 py-4 text-[10px]">لا توجد مواعيد متبقية متاحة لهذا اليوم.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookingCalendar;
