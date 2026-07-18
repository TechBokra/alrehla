import React from 'react';
import { useRouter } from 'next/navigation';
import { useInstructorData } from '../../hooks/queries/instructor/useInstructorDataQuery';
import PageLoader from '@alrehla/ui/page-loader';
import StatCard from '../../components/admin/StatCard';
import { Calendar, BookOpen, Award } from 'lucide-react';

const createNavigate = (router: ReturnType<typeof useRouter>) => (
    href: string | number,
    options?: { replace?: boolean },
) => {
    if (typeof href === 'number') {
        router.back();
        return;
    }

    const target = href || '/';
    if (options?.replace) router.replace(target);
    else router.push(target);
};

const InstructorDashboardPage: React.FC = () => {
    const router = useRouter();
    const navigate = createNavigate(router);
    const { data, isLoading } = useInstructorData();

    if (isLoading || !data) {
        return <PageLoader text="جاري تحميل لوحة التحكم..." />;
    }
    
    if (!data.instructor) {
        return <div className="text-center text-red-500 p-4">لم يتم العثور على ملف المدرب الخاص بك.</div>;
    }

    const { instructor, bookings, introSessionsThisMonth } = data;

    const upcomingSessionsCount = bookings.reduce((count, booking) => {
        return count + (booking.sessions?.filter((s: any) => s.status === 'upcoming').length || 0);
    }, 0);

    const activeJourneysCount = bookings.filter((b: any) => b.status === 'مؤكد').length;
    const introSessionGoalMet = introSessionsThisMonth >= 1;

    return (
        <div className="animate-fadeIn space-y-8">
            <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800">أهلاً بك، {instructor.name}</h1>
                <p className="text-lg text-gray-600 mt-1">هنا ملخص لرحلاتك التدريبية وجدولك الزمني.</p>
            </div>

            <div className="space-y-8 mt-8">
                <h2 className="text-2xl font-bold text-gray-800">نظرة عامة</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <StatCard 
                        title="الجلسات القادمة" 
                        value={upcomingSessionsCount} 
                        icon={<Calendar className="h-4 w-4 text-muted-foreground" />} 
                        onClick={() => navigate('/schedule')}
                    />
                    <StatCard 
                        title="الرحلات النشطة" 
                        value={activeJourneysCount} 
                        icon={<BookOpen className="h-4 w-4 text-muted-foreground" />} 
                        onClick={() => navigate('/journeys')}
                    />
                    <StatCard 
                        title="الجلسات التعريفية (هذا الشهر)" 
                        value={`${introSessionsThisMonth} / 1`}
                        icon={<Award className={`h-4 w-4 ${introSessionGoalMet ? "text-green-500" : "text-yellow-500"}`} />} 
                    />
                </div>
                {!introSessionGoalMet && (
                    <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800">
                        <p className="text-sm font-bold">تذكير: مطلوب منك إكمال جلسة تعريفية واحدة على الأقل شهرياً.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InstructorDashboardPage;