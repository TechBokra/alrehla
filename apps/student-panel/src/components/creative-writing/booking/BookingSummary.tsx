"use client";


import React, { useMemo } from 'react';
import { User, Package, UserCheck, Calendar, CreditCard, Clock, ChevronDown } from 'lucide-react';
import { Button } from '@alrehla/ui/button';
import { formatDate } from '../../../utils/helpers';
import type { CreativeWritingPackage, Instructor } from '../../../lib/database.types';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@alrehla/ui/card';
import Accordion from '@alrehla/ui/accordion';

interface BookingSummaryProps {
    childName: string | null;
    pkg: CreativeWritingPackage | null;
    instructor: Instructor | null;
    dateTime: { date: Date, time: string } | null;
    onSubmit: () => void;
    isSubmitting: boolean;
    isConfirmStep: boolean;
    finalPrice: number | null;
    priceRange: { min: number, max: number } | null;
}

const SummaryRow: React.FC<{ icon: React.ReactNode, label: string, value: string | null }> = ({ icon, label, value }) => (
    <div className="flex items-start gap-3 text-sm">
        <div className="flex-shrink-0 text-muted-foreground mt-1">{icon}</div>
        <div className="flex-grow">
            <p className="font-semibold text-muted-foreground text-xs">{label}</p>
            <p className="font-bold text-foreground text-sm">{value || '...'}</p>
        </div>
    </div>
);


const BookingSummary: React.FC<BookingSummaryProps> = ({
    childName,
    pkg,
    instructor,
    dateTime,
    onSubmit,
    isSubmitting,
    isConfirmStep,
    finalPrice,
    priceRange
}) => {
    
    // احتساب الجدول الزمني الكامل للمعاينة
    const fullSchedule = useMemo(() => {
        if (!pkg || !dateTime) return [];
        
        // منطق استخراج العدد المحدث
        let count = 1;
        if (pkg.name.includes('التعريفية') || pkg.sessions.includes('واحدة')) {
            count = 1;
        } else {
            const match = pkg.sessions.match(/^(\d+)/);
            count = match ? parseInt(match[1]) : 1;
        }

        const schedule = [];
        const baseDate = new Date(dateTime.date);

        for (let i = 0; i < count; i++) {
            const d = new Date(baseDate);
            d.setDate(baseDate.getDate() + (i * 7));
            schedule.push(d.toISOString());
        }
        return schedule;
    }, [pkg, dateTime]);

    const renderPrice = () => {
        if (finalPrice !== null) {
            return finalPrice === 0 ? 'مجاني' : `${finalPrice} ج.م`;
        }
        if (priceRange) {
            return priceRange.min === priceRange.max 
                ? `${priceRange.min} ج.م` 
                : `${priceRange.min} - ${priceRange.max} ج.م`;
        }
        return '...';
    };

    return (
        <Card className="shadow-lg border-t-4 border-t-primary">
            <CardHeader className="pb-4">
                <CardTitle className="text-lg">ملخص الحجز</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
                <SummaryRow icon={<User size={14}/>} label="الطالب" value={childName || null} />
                <SummaryRow icon={<Package size={14}/>} label="الباقة" value={pkg?.name || null} />
                <SummaryRow icon={<UserCheck size={14}/>} label="المدرب" value={instructor?.name || null} />
                <SummaryRow 
                    icon={<Calendar size={14}/>} 
                    label="بداية الرحلة" 
                    value={dateTime ? `${formatDate(dateTime.date.toISOString())} في ${dateTime.time}` : null} 
                />

                {/* معاينة الجدول الكامل */}
                {dateTime && pkg && fullSchedule.length > 1 && (
                    <div className="mt-4">
                        <Accordion title={<span className="text-xs font-bold text-blue-700 flex items-center gap-2"><Clock size={14}/> عرض الجدول الزمني الكامل</span>} className="!border-0 !p-0">
                            <div className="pt-2 space-y-2">
                                {fullSchedule.map((dateStr, idx) => (
                                    <div key={idx} className="flex items-center gap-3 text-xs bg-muted/30 p-2 rounded-lg border border-muted/50">
                                        <div className="w-5 h-5 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full font-bold">{idx + 1}</div>
                                        <div className="flex-grow flex items-center gap-2">
                                            <p className="font-semibold text-gray-700">{formatDate(dateStr)}</p>
                                            <span className="text-gray-400">|</span>
                                            <p className="font-bold text-primary">{dateTime.time}</p>
                                        </div>
                                        {idx === 0 && <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold">بداية</span>}
                                    </div>
                                ))}
                                <p className="text-[10px] text-muted-foreground italic mt-2">* المواعيد أسبوعية تتبع أول موعد اخترته.</p>
                            </div>
                        </Accordion>
                    </div>
                )}
            </CardContent>
            
            {pkg && (
                <CardFooter className="flex-col items-stretch space-y-2 border-t pt-6">
                    <div className="flex justify-between items-center text-xl font-bold">
                        <span>الإجمالي</span>
                        <span className="text-primary">{renderPrice()}</span>
                    </div>
                     <Button
                        onClick={onSubmit}
                        loading={isSubmitting}
                        disabled={!isConfirmStep || isSubmitting}
                        className="w-full mt-6 h-12 text-lg shadow-md"
                        icon={<CreditCard />}
                        variant="success"
                    >
                        {isSubmitting ? 'جاري الإضافة...' : (finalPrice === 0 ? 'تأكيد الحجز المجاني' : 'أضف للسلة وأكمل')}
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
};

export default React.memo(BookingSummary);
