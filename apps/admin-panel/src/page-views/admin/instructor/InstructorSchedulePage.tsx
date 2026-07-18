import React from 'react';
import { useInstructorData } from '../../../hooks/queries/instructor/useInstructorDataQuery';
import PageLoader from '@alrehla/ui/page-loader';
import InstructorSchedulePanel from '../../../components/admin/dashboards/InstructorSchedulePanel';

const InstructorSchedulePage: React.FC = () => {
    const { data, isLoading } = useInstructorData();

    if (isLoading || !data) {
        return <PageLoader text="جاري تحميل الجدول..." />;
    }

    if (!data.instructor) {
        return <div className="text-center text-red-500 p-4">لم يتم العثور على ملف المدرب الخاص بك.</div>;
    }

    return (
        <div className="animate-fadeIn space-y-8">
            <h1 className="text-3xl font-extrabold text-foreground">إدارة الجدول الأسبوعي</h1>
            <InstructorSchedulePanel instructor={data.instructor} bookings={data.bookings} />
        </div>
    );
};

export default InstructorSchedulePage;