'use client';

import React from 'react';
import { useInstructorSchedule } from '../../hooks/queries/instructor/useInstructorSchedule';
import PageLoader from '@alrehla/ui/page-loader';
import InstructorSchedulePanel from '../../components/instructor/InstructorSchedulePanel';

const InstructorSchedulePage: React.FC = () => {
    const { instructor, bookings, isLoading, error } = useInstructorSchedule();

    if (isLoading) {
        return <PageLoader text="جاري تحميل الجدول..." />;
    }

    if (error) {
        return <div className="p-8 text-center text-red-600">تعذر تحميل بيانات الجدول.</div>;
    }

    if (!instructor) {
        return (
            <div className="text-center py-16 bg-white border rounded-2xl p-6 max-w-lg mx-auto">
                <p className="text-red-600 font-bold mb-2">لم يتم العثور على ملف المدرب الخاص بك.</p>
                <p className="text-sm text-muted-foreground">يرجى التواصل مع الإدارة لربط حسابك كمدرب معتمد.</p>
            </div>
        );
    }

    return (
        <div className="animate-fadeIn space-y-8">
            <h1 className="text-3xl font-extrabold text-foreground">إدارة الجدول الأسبوعي</h1>
            <InstructorSchedulePanel instructor={instructor} bookings={bookings as any[]} />
        </div>
    );
};

export default InstructorSchedulePage;
