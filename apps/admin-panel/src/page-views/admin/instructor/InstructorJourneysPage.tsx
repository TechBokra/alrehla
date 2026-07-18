import React from 'react';
import { useInstructorData } from '../../../hooks/queries/instructor/useInstructorDataQuery';
import PageLoader from '@alrehla/ui/page-loader';
import InstructorJourneysPanel from '../../../components/admin/dashboards/InstructorJourneysPanel';

const InstructorJourneysPage: React.FC = () => {
    const { data, isLoading } = useInstructorData();

    if (isLoading || !data) {
        return <PageLoader text="جاري تحميل الرحلات..." />;
    }
    
    if (!data.instructor) {
        return <div className="text-center text-red-500 p-4">لم يتم العثور على ملف المدرب الخاص بك.</div>;
    }
    
    return (
        <div className="animate-fadeIn space-y-8">
             <h1 className="text-3xl font-extrabold text-foreground">رحلات الطلاب</h1>
            <InstructorJourneysPanel instructorBookings={data.bookings as any[]} />
        </div>
    );
};

export default InstructorJourneysPage;