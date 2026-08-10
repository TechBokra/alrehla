
import React, { useState, useMemo } from 'react';
import { Save, Plus, Trash2, Calendar, Star, Info, CheckCircle } from 'lucide-react';
import { useInstructorMutations } from '../../../hooks/mutations/useInstructorMutations';
import type { Instructor, AvailableSlots } from '../../../lib/database.types';
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
                // فلترة الساعات فقط عند التحميل الأولي
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
            const daySlots = prev[date].filter(t => t !== time);
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
        // فلترة نهائية قبل الحفظ لضمان السلامة
        const finalAvailability: AvailableSlots = {};
        Object.keys(availability).forEach(date => {
            finalAvailability[date] = availability[date].filter(t => t.endsWith(':00'));
        });
        requestIntroAvailabilityChange.mutate({ instructorId: instructor.id, availability: finalAvailability });
    };

    const totalSlots = useMemo(() => 
        Object.values(availability).reduce((acc: number, times) => acc + (times as string[]).length, 0),
    [availability]);

    return (
        <div className="space-y-6">
            <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 flex items-start gap-3">
                <Star className="text-yellow-600 mt-1 flex-shrink-0" />
                <div className="text-sm">
                    <p className="font-bold text-yellow-800">نظام الجلسات التعريفية المجانية</p>
                    <p className="text-yellow-700 mt-1">يجب توفير <span className="font-black">جلسة واحدة على الأقل شهرياً</span>. المواعيد تعتمد نظام الساعات الكاملة فقط.</p>
                </div>
            </div>

            <div className="bg-muted/30 p-5 rounded-xl border-2 border-dashed border-muted flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                    <label className="text-xs font-bold mb-1.5 block text-gray-600">اختر تاريخ الجلسة</label>
                    <DatePicker
                        id="intro-availability-date"
                        value={selectedDate}
                        onChange={setSelectedDate}
                        className="bg-white"
                    />
                </div>
                <div className="flex-1 w-full">
                    <label className="text-xs font-bold mb-1.5 block text-gray-600">وقت البدء (60 دقيقة)</label>
                    <Select value={selectedTime} onChange={e => setSelectedTime(e.target.value)} className="bg-white">
                        {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                    </Select>
                </div>
                <Button type="button" onClick={handleAddTime} icon={<Plus size={18}/>} className="w-full sm:w-auto h-10 px-6">إضافة للمسودة</Button>
            </div>

            <div className="space-y-4">
                <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <Calendar size={16} /> المواعيد المقترحة حالياً ({totalSlots})
                </h4>
                
                {Object.keys(availability).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(availability).sort().map(([date, times], idx) => (
                            <Card key={date} className="overflow-hidden border-primary/10">
                                <CardContent className="p-0">
                                    <div className="bg-primary/5 px-4 py-2 border-b flex justify-between items-center">
                                        <span className="font-bold text-sm text-primary">{date}</span>
                                        {idx === 0 && <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold uppercase">الأساسية</span>}
                                    </div>
                                    <div className="p-3 flex flex-wrap gap-2">
                                        {(times as string[]).map(time => (
                                            <div key={time} className="flex items-center gap-2 bg-white border border-blue-100 text-blue-700 pl-1 pr-3 py-1 rounded-full text-xs font-mono font-bold shadow-sm group">
                                                {time}
                                                <button 
                                                    onClick={() => handleRemoveTime(date, time)} 
                                                    className="w-5 h-5 flex items-center justify-center rounded-full bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                                                    title="حذف الموعد"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dotted text-gray-400">
                        <Info className="mx-auto mb-2 opacity-50" />
                        <p>لا توجد مواعيد تعريفية مضافة حالياً.</p>
                    </div>
                )}
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center pt-6 border-t gap-4">
                <div className="flex items-center gap-2 text-xs">
                    {totalSlots >= 1 ? (
                        <span className="text-green-600 font-bold flex items-center gap-1"><CheckCircle size={14}/> تم استيفاء الحد الأدنى</span>
                    ) : (
                        <span className="text-red-500 font-bold flex items-center gap-1"><Info size={14}/> مطلوب موعد واحد على الأقل</span>
                    )}
                </div>
                <Button 
                    onClick={handleSave} 
                    loading={requestIntroAvailabilityChange.isPending} 
                    disabled={totalSlots === 0}
                    icon={<Save />}
                    size="lg"
                    className="w-full sm:w-auto shadow-lg"
                >
                    تحديث مواعيد الجلسات التعريفية
                </Button>
            </div>
        </div>
    );
};

export default IntroductoryAvailabilityManager;
