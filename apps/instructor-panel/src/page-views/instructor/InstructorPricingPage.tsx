'use client';

import React from 'react';
import { useInstructorData } from '../../hooks/queries/instructor/useInstructorDataQuery';
import PageLoader from '@alrehla/ui/page-loader';
import InstructorPricingPanel from '../../components/instructor/InstructorPricingPanel';

const InstructorPricingPage: React.FC = () => {
    const { data, isLoading } = useInstructorData();

    if (isLoading || !data) {
        return <PageLoader text="جاري تحميل إعدادات التسعير..." />;
    }

    if (!data.instructor) {
        return (
            <div className="text-center py-16 bg-white border rounded-2xl p-6 max-w-lg mx-auto">
                <p className="text-red-600 font-bold mb-2">لم يتم العثور على ملف المدرب الخاص بك.</p>
                <p className="text-sm text-muted-foreground">يرجى التواصل مع الإدارة لربط حسابك كمدرب معتمد.</p>
            </div>
        );
    }

    return (
        <div className="animate-fadeIn space-y-8">
            <InstructorPricingPanel instructor={data.instructor} />
        </div>
    );
};

export default InstructorPricingPage;
