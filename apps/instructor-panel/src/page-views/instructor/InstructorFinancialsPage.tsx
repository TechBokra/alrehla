'use client';

import React from 'react';
import { useInstructorFinancials } from '../../hooks/queries/instructor/useInstructorFinancials';
import PageLoader from '@alrehla/ui/page-loader';
import InstructorFinancialsPanel from '../../components/instructor/InstructorFinancialsPanel';

const InstructorFinancialsPage: React.FC = () => {
    const { instructor, financialSummary, isLoading, error } = useInstructorFinancials();

    if (isLoading) {
        return <PageLoader text="جاري تحميل البيانات المالية..." />;
    }

    if (error) {
        return <div className="p-8 text-center text-red-600">تعذر تحميل البيانات المالية.</div>;
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
            <h1 className="text-3xl font-extrabold text-foreground">الماليات والمستحقات</h1>
            <InstructorFinancialsPanel financialSummary={financialSummary} />
        </div>
    );
};

export default InstructorFinancialsPage;
