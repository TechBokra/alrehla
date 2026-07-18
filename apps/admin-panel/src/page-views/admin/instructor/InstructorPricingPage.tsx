import React from 'react';
import { useInstructorData } from '../../../hooks/queries/instructor/useInstructorDataQuery';
import PageLoader from '@alrehla/ui/page-loader';
import InstructorPricingPanel from '../../../components/admin/dashboards/InstructorPricingPanel';

const InstructorPricingPage: React.FC = () => {
    const { data, isLoading } = useInstructorData();

    if (isLoading || !data) {
        return <PageLoader text="جاري تحميل إعدادات التسعير..." />;
    }

    if (!data.instructor) {
        return <div className="text-center text-red-500 p-4">لم يتم العثور على ملف المدرب الخاص بك.</div>;
    }

    return (
        <div className="animate-fadeIn space-y-8">
            <InstructorPricingPanel instructor={data.instructor} />
        </div>
    );
};

export default InstructorPricingPage;