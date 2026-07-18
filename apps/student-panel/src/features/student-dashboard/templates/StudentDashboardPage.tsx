"use client";


import React, { useMemo } from 'react';
import { useStudentDashboardData } from '../../../hooks/queries/user/useJourneyDataQuery';
import PageLoader from '@alrehla/ui/page-loader';
import StudentJourneyCard from '../../../components/student/StudentJourneyCard';
import BadgeDisplay from '../../../components/shared/BadgeDisplay';
import { BookOpen, ShoppingBag, Star, Award, Link2Off, AlertCircle, Clock } from 'lucide-react';
import { getStatusColor, formatDate } from '../../../utils/helpers';
import type { Badge } from '../../../lib/database.types';
import { Card, CardContent, CardHeader, CardTitle } from '@alrehla/ui/card';

const StudentDashboardPage: React.FC = () => {
    const { data, isLoading, error } = useStudentDashboardData();

    const { activeJourneys, pendingJourneys } = useMemo(() => {
        if (!data?.journeys) return { activeJourneys: [], pendingJourneys: [] };
        
        return {
            activeJourneys: data.journeys.filter((j: any) => ['مؤكد', 'مكتمل'].includes(j.status)),
            pendingJourneys: data.journeys.filter((j: any) => ['بانتظار الدفع', 'بانتظار المراجعة'].includes(j.status))
        };
    }, [data]);

    if (isLoading) {
        return <PageLoader text="جاري فحص حالة الحساب..." />;
    }

    if (data?.isUnlinked) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-fadeIn">
                <div className="bg-orange-100 p-6 rounded-full mb-6">
                    <Link2Off className="w-16 h-16 text-orange-600" />
                </div>
                <h2 className="text-3xl font-black text-gray-800">هذا الحساب غير مرتبط بملف طالب</h2>
                <p className="text-gray-600 max-w-md mt-4 text-lg leading-relaxed">
                    مرحباً بك. يبدو أن حسابك لم يتم ربطه بملف الطفل في لوحة تحكم ولي الأمر بعد. 
                    <br/>
                    <span className="font-bold text-orange-700">يرجى الطلب من ولي أمرك تنفيذ "ربط الحساب" من المركز العائلي.</span>
                </p>
                <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-3 text-right max-w-lg">
                    <AlertCircle className="text-blue-500 shrink-0 mt-1" />
                    <p className="text-sm text-blue-800 font-semibold">ملاحظة للمسؤول: إذا كنت ترى هذا المستخدم مرتبطاً في لوحة الأدمن، فهذا يعني أن معرّف الطالب في جدول `child_profiles` لا يزال فارغاً أو غير صحيح.</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return <div className="text-center py-20 text-red-500 font-bold">حدث خطأ أثناء جلب البيانات.</div>;
    }

    const { badges = [] } = data;

    return (
        <div className="space-y-12 animate-fadeIn">
            {/* قسم الرحلات النشطة */}
            <section>
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-3 mb-6">
                    <BookOpen className="text-primary" /> رحلاتي التدريبية
                </h2>
                {activeJourneys.length > 0 ? (
                    <div className="space-y-6">
                        {activeJourneys.map((journey: any) => (
                            <StudentJourneyCard key={journey.id} journey={journey} />
                        ))}
                    </div>
                ) : pendingJourneys.length === 0 ? (
                    <Card><CardContent className="text-center py-10 text-muted-foreground">لا توجد رحلات نشطة بعد.</CardContent></Card>
                ) : null}
            </section>

            {/* قسم الرحلات بانتظار التأكيد */}
            {pendingJourneys.length > 0 && (
                <section className="animate-fadeIn">
                    <h2 className="text-xl font-bold text-orange-600 flex items-center gap-3 mb-6">
                        <Clock /> رحلات بانتظار تفعيل الإدارة ({pendingJourneys.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-80">
                        {pendingJourneys.map((journey: any) => (
                            <Card key={journey.id} className="border-dashed border-orange-200 bg-orange-50/30">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg text-gray-700">{journey.package_name}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-orange-700 font-semibold flex items-center gap-2">
                                        <AlertCircle size={14} /> جاري مراجعة طلب الاشتراك وتأكيد الموعد مع المدرب...
                                    </p>
                                    <p className="text-xs text-gray-500 mt-2 italic">ستظهر هذه الرحلة في قسم "رحلاتي" فور اعتمادها.</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>
            )}

             <section>
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-3 mb-6">
                    <Award className="text-yellow-500" /> إنجازاتي
                </h2>
                {badges.length > 0 ? (
                    <Card>
                        <CardContent className="pt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                            {(badges as Badge[]).map(badge => (
                                <BadgeDisplay key={badge.id} badge={badge} />
                            ))}
                        </CardContent>
                    </Card>
                ) : (
                     <Card><CardContent className="text-center py-10 text-muted-foreground">لم تحصل على شارات بعد.</CardContent></Card>
                )}
            </section>
        </div>
    );
};

export default StudentDashboardPage;
