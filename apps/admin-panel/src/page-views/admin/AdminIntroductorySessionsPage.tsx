
import React, { useState, useMemo } from 'react';
import { Star, Calendar, CheckCircle, AlertCircle, Clock, Search } from 'lucide-react';
import { useAdminInstructors } from '../../hooks/queries/admin/useAdminInstructorsQuery';
import { useAdminScheduledSessions } from '../../hooks/queries/admin/useAdminSchedulingQuery';
import PageLoader from '@alrehla/ui/page-loader';
import ErrorState from '@alrehla/ui/error-state';
import IntroductorySessionSchedulerModal from '../../components/admin/IntroductorySessionSchedulerModal';
import { Button } from '@alrehla/ui/button';
import { formatDate } from '../../utils/helpers';
import type { Instructor } from '../../lib/database.types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@alrehla/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@alrehla/ui/table';
import { Input } from '@alrehla/ui/input';

const AdminIntroductorySessionsPage: React.FC = () => {
    const { data: instructors = [], isLoading: instructorsLoading, error: instructorsError, refetch: refetchInstructors } = useAdminInstructors();
    const { data: sessions = [], isLoading: sessionsLoading, error: sessionsError, refetch: refetchSessions } = useAdminScheduledSessions();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const isLoading = instructorsLoading || sessionsLoading;
    const error = instructorsError || sessionsError;

    const instructorSessionStatus = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        return instructors.map(instructor => {
            const instructorSessions = (sessions as any[]).filter(s =>
                s.instructor_id === instructor.id &&
                s.package_name === 'الجلسة التعريفية' &&
                new Date(s.session_date).getMonth() === currentMonth &&
                new Date(s.session_date).getFullYear() === currentYear
            );

            return {
                instructor,
                hasScheduled: instructorSessions.length > 0,
                sessionsCount: instructorSessions.length,
                upcomingDates: instructorSessions
                    .map(s => s.session_date)
                    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime()),
            };
        }).filter(item => 
            searchTerm === '' || item.instructor.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [instructors, sessions, searchTerm]);
    
    const stats = useMemo(() => {
        const total = instructors.length;
        const committed = instructorSessionStatus.filter(s => s.hasScheduled).length;
        return { total, committed, pending: total - committed };
    }, [instructorSessionStatus, instructors]);

    const handleOpenScheduler = (instructor: Instructor) => {
        setSelectedInstructor(instructor);
        setIsModalOpen(true);
    };

    if (isLoading) return <PageLoader text="جاري تحميل مصفوفة الالتزام..." />;
    if (error) return <ErrorState message={(error as Error).message} onRetry={() => { refetchInstructors(); refetchSessions(); }} />;

    return (
        <>
            <IntroductorySessionSchedulerModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                instructor={selectedInstructor}
            />
            <div className="animate-fadeIn space-y-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-foreground">الالتزام بالجلسات التعريفية</h1>
                    <p className="text-muted-foreground mt-1">
                        متابعة تقديم المدربين لجلسة تعريفية واحدة على الأقل شهرياً. (الشهر الحالي: {new Date().toLocaleString('ar-EG', { month: 'long' })})
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-green-50 border-green-200">
                        <CardHeader className="pb-2 text-green-800 font-bold text-sm uppercase">ملتزمون هذا الشهر</CardHeader>
                        <CardContent><p className="text-4xl font-black text-green-600">{stats.committed}</p></CardContent>
                    </Card>
                    <Card className="bg-orange-50 border-orange-200">
                        <CardHeader className="pb-2 text-orange-800 font-bold text-sm uppercase">لم يجدولوا بعد</CardHeader>
                        <CardContent><p className="text-4xl font-black text-orange-600">{stats.pending}</p></CardContent>
                    </Card>
                    <Card className="bg-blue-50 border-blue-200">
                        <CardHeader className="pb-2 text-blue-800 font-bold text-sm uppercase">إجمالي المدربين</CardHeader>
                        <CardContent><p className="text-4xl font-black text-blue-600">{stats.total}</p></CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader className="border-b">
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Star className="text-yellow-500" /> مصفوفة المدربين
                            </CardTitle>
                            <div className="relative w-full md:w-72">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                <Input 
                                    placeholder="بحث باسم المدرب..." 
                                    value={searchTerm} 
                                    onChange={e => setSearchTerm(e.target.value)} 
                                    className="pr-10 h-9"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/30">
                                        <TableHead className="py-4">المدرب</TableHead>
                                        <TableHead className="text-center">حالة الالتزام</TableHead>
                                        <TableHead>عدد الجلسات المجدولة</TableHead>
                                        <TableHead>التواريخ القادمة (هذا الشهر)</TableHead>
                                        <TableHead>إجراء</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {instructorSessionStatus.map(({ instructor, hasScheduled, sessionsCount, upcomingDates }) => (
                                        <TableRow key={instructor.id} className="hover:bg-muted/10">
                                            <TableCell className="font-bold py-4">
                                                <div className="flex items-center gap-3">
                                                    <img src={instructor.avatar_url || 'https://i.ibb.co/2S4xT8w/male-avatar.png'} className="w-8 h-8 rounded-full border" />
                                                    {instructor.name}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {hasScheduled ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                                        <CheckCircle size={12} /> ملتزم
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 animate-pulse">
                                                        <AlertCircle size={12} /> بانتظار الجدولة
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-lg font-bold ${sessionsCount > 0 ? 'text-primary' : 'text-gray-300'}`}>{sessionsCount}</span>
                                                    <span className="text-xs text-muted-foreground">جلسة</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1 max-w-xs">
                                                    {upcomingDates.length > 0 ? upcomingDates.map((date, i) => (
                                                        <span key={i} className="text-[10px] font-mono bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded">
                                                            {formatDate(date)}
                                                        </span>
                                                    )) : <span className="text-gray-300 text-xs">-</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Button 
                                                    onClick={() => handleOpenScheduler(instructor)} 
                                                    size="sm" 
                                                    variant="outline"
                                                    className="h-8"
                                                    icon={<Calendar size={14} />}
                                                >
                                                    {hasScheduled ? 'إضافة جلسة أخرى' : 'جدولة الجلسة الأولى'}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            {instructorSessionStatus.length === 0 && (
                                <div className="text-center py-20 text-muted-foreground">
                                    لا توجد نتائج لمصطلح البحث هذا.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
};

export default AdminIntroductorySessionsPage;
