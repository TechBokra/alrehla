import React from 'react';
import { useInstructorData } from '../../../hooks/queries/instructor/useInstructorDataQuery';
import PageLoader from '@alrehla/ui/page-loader';
import InstructorProfilePanel from '../../../components/admin/dashboards/InstructorProfilePanel';

const InstructorProfilePage: React.FC = () => {
    const { data, isLoading } = useInstructorData();

    if (isLoading || !data) {
        return <PageLoader text="جاري تحميل الملف الشخصي..." />;
    }

    if (!data.instructor) {
        return <div className="text-center text-red-500 p-4">لم يتم العثور على ملف المدرب الخاص بك.</div>;
    }

    return (
        <div className="animate-fadeIn space-y-8">
            <h1 className="text-3xl font-extrabold text-foreground">ملفي الشخصي</h1>
            <InstructorProfilePanel instructor={data.instructor} />
        </div>
    );
};

export default InstructorProfilePage;