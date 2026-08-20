'use client';

import React from 'react';
import { useInstructorData } from '../../hooks/queries/instructor/useInstructorDataQuery';
import PageLoader from '@alrehla/ui/page-loader';
import InstructorProfilePanel from '../../components/instructor/InstructorProfilePanel';

const InstructorProfilePage: React.FC = () => {
    const { data, isLoading } = useInstructorData();

    if (isLoading || !data) {
        return <PageLoader text="جاري تحميل الملف الشخصي..." />;
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
            <h1 className="text-3xl font-extrabold text-foreground">ملفي الشخصي</h1>
            <InstructorProfilePanel instructor={data.instructor} />
        </div>
    );
};

export default InstructorProfilePage;
