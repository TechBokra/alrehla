import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useInstructorData } from '../../hooks/queries/instructor/useInstructorDataQuery';
import PageLoader from '@alrehla/ui/page-loader';
import StatCard from '../ui/StatCard';
import { Calendar, BookOpen, Award, Star } from 'lucide-react';
import InstructorJourneysPanel from './InstructorJourneysPanel';
import WeeklySessionsWidget from './WeeklySessionsWidget';
import { Card, CardContent, CardHeader, CardTitle } from '@alrehla/ui/card';

const InstructorDashboardPanel: React.FC = () => {
    const { data, isLoading } = useInstructorData();

    const bookings = data?.bookings;
    const instructor = data?.instructor;
    const introSessionsThisMonth = data?.introSessionsThisMonth;

    const allScheduledSessions = useMemo(() => {
        return (bookings || []).flatMap((b: any) => 
            (b.sessions || []).map((s: any) => ({
                ...s,
                child_name: b.child_profiles?.name,
                package_name: b.package_name
            }))
        );
    }, [bookings]);

    const upcomingSessionsCount = useMemo(() => {
        return allScheduledSessions.filter((s: any) => 
            s.status === 'upcoming' && new Date(s.session_date) >= new Date()
        ).length;
    }, [allScheduledSessions]);

    const activeJourneysCount = (bookings || []).filter((b: any) => b.status === 'مؤكد').length;
    const introSessionGoalMet = (introSessionsThisMonth || 0) >= 1;

    if (isLoading || !data) {
        return <PageLoader text="جاري تحميل لوحة التحكم..." />;
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
        <div className="animate-fadeIn space-y-8 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800">أهلاً بك، {instructor.name}</h1>
                    <p className="text-lg text-gray-600 mt-1">إليك ملخص جدولك وأداء طلابك لهذا الأسبوع.</p>
                </div>
                <div className="flex gap-2">
                    {instructor.profile_update_status === 'pending' && (
                        <div className="bg-orange-50 border border-orange-200 text-orange-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm animate-pulse">
                            <Star size={16} /> تحديث بياناتك قيد المراجعة
                        </div>
                    )}
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="جلسات الأسبوع" 
                    value={upcomingSessionsCount} 
                    icon={<Calendar className="h-4 w-4 text-blue-500" />} 
                />
                <StatCard 
                    title="الطلاب النشطون" 
                    value={activeJourneysCount} 
                    icon={<BookOpen className="h-4 w-4 text-purple-500" />} 
                />
                <StatCard 
                    title="جلسات تعريفية (هذا الشهر)" 
                    value={`${introSessionsThisMonth || 0} / 1`}
                    icon={<Award className={`h-4 w-4 ${introSessionGoalMet ? "text-green-500" : "text-yellow-500"}`} />} 
                />
                 <Card className={introSessionGoalMet ? "bg-green-50/50 border-green-100" : "bg-blue-50/50 border-blue-100"}>
                    <CardHeader className="p-4 pb-2"><CardTitle className="text-xs text-muted-foreground uppercase font-black">حالة التواجد</CardTitle></CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="text-sm font-bold text-gray-700 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-ping"></div>
                            متاح لاستقبال طلاب جدد
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2">
                    <WeeklySessionsWidget sessions={allScheduledSessions} instructorName={instructor.name} />
                </div>
                <div className="xl:col-span-1">
                    <InstructorJourneysPanel instructorBookings={bookings as any[]} />
                </div>
            </div>
        </div>
    );
};

export default InstructorDashboardPanel;
