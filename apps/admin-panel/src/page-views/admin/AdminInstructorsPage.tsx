
import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Users, Plus, UserCog, Calendar, FileEdit, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAdminInstructors } from '../../hooks/queries/admin/useAdminInstructorsQuery';
import { useInstructorMutations } from '../../hooks/mutations/useInstructorMutations';
import PageLoader from '@alrehla/ui/page-loader';
import AvailabilityManager from '../../components/admin/AvailabilityManager';
import { Button } from '@alrehla/ui/button';
import ErrorState from '@alrehla/ui/error-state';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@alrehla/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@alrehla/ui/table';
import Accordion from '@alrehla/ui/accordion';
import type { Instructor } from '../../lib/database.types';
import SortableTableHead from '../../components/admin/ui/SortableTableHead';
import { Trash2, UserPlus, Info } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@alrehla/ui/tabs';

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

const AdminInstructorsPage: React.FC = () => {
    const router = useRouter();
    const navigate = createNavigate(router);
    const { data: instructors = [], isLoading, error, refetch } = useAdminInstructors();
    const { deleteInstructor } = useInstructorMutations();
    const [sortConfig, setSortConfig] = useState<{ key: keyof Instructor; direction: 'asc' | 'desc' } | null>({ key: 'name', direction: 'asc' });
    const [activeTab, setActiveTab] = useState('all');

    // تصفية المدربين الذين لديهم طلبات معلقة
    const pendingInstructors = useMemo(() => {
        return instructors.filter(i => i.schedule_status === 'pending' || i.profile_update_status === 'pending');
    }, [instructors]);

    const displayedInstructors = useMemo(() => {
        let list = activeTab === 'requests' ? pendingInstructors : instructors;
        
        if (sortConfig !== null) {
            list.sort((a, b) => {
                const aVal = a[sortConfig.key] || '';
                const bVal = b[sortConfig.key] || '';
                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return list;
    }, [instructors, pendingInstructors, activeTab, sortConfig]);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key: key as keyof Instructor, direction });
    };

    const handleDeleteInstructor = async (id: number, name: string) => {
        if (window.confirm(`هل أنت متأكد من حذف المدرب "${name}"؟ هذا الإجراء لا يمكن التراجع عنه.`)) {
            deleteInstructor.mutate({ instructorId: id });
        }
    };

    if (isLoading) return <PageLoader text="جاري تحميل بيانات المدربين..." />;
    if (error) return <ErrorState message={(error as Error).message} onRetry={refetch} />;

    return (
        <div className="animate-fadeIn space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-3">
                    <UserCog className="text-primary" /> إدارة المدربين
                </h1>
                <Button onClick={() => navigate('/users?tab=staff')} variant="outline" className="gap-2 border-primary text-primary hover:bg-primary/5">
                    <UserPlus size={18} /> إضافة مدرب جديد (عبر إدارة الموظفين)
                </Button>
            </div>

            {/* تنبيه بالطلبات المعلقة */}
            {pendingInstructors.length > 0 && activeTab !== 'requests' && (
                <div 
                    className="bg-orange-50 border-r-4 border-orange-400 p-4 rounded-lg shadow-sm cursor-pointer hover:bg-orange-100 transition-colors flex justify-between items-center"
                    onClick={() => setActiveTab('requests')}
                >
                    <div className="flex items-center gap-3">
                        <AlertCircle className="text-orange-600 h-6 w-6" />
                        <div>
                            <h3 className="font-bold text-orange-800">يوجد {pendingInstructors.length} طلبات تحديث معلقة</h3>
                            <p className="text-sm text-orange-700">هناك مدربون قاموا بتحديث جداولهم أو بياناتهم وبانتظار موافقتك.</p>
                        </div>
                    </div>
                    <Button variant="outline" className="bg-white text-orange-700 border-orange-200">عرض الطلبات</Button>
                </div>
            )}
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="all" className="gap-2">
                        <Users size={16}/> كل المدربين
                    </TabsTrigger>
                    <TabsTrigger value="requests" className="gap-2 relative">
                        <AlertCircle size={16} className={pendingInstructors.length > 0 ? "text-orange-500" : ""}/> 
                        طلبات التحديث
                        {pendingInstructors.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full">
                                {pendingInstructors.length}
                            </span>
                        )}
                    </TabsTrigger>
                </TabsList>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            {activeTab === 'requests' ? 'مراجعة التحديثات المعلقة' : 'قائمة المدربين المعتمدين'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/30">
                                        <SortableTableHead<Instructor> sortKey="name" label="المدرب" sortConfig={sortConfig} onSort={handleSort} />
                                        <SortableTableHead<Instructor> sortKey="specialty" label="التخصص" sortConfig={sortConfig} onSort={handleSort} />
                                        <TableHead>حالة التحديثات</TableHead>
                                        <TableHead>إجراءات</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {displayedInstructors.length > 0 ? (
                                        displayedInstructors.map(instructor => (
                                            <TableRow key={instructor.id} className="hover:bg-muted/10">
                                                <TableCell className="flex items-center gap-3">
                                                    <img src={instructor.avatar_url || 'https://i.ibb.co/2S4xT8w/male-avatar.png'} alt={instructor.name} className="w-10 h-10 rounded-full object-cover border" loading="lazy" />
                                                    <span className="font-bold text-foreground">{instructor.name}</span>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm">{instructor.specialty}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-2">
                                                        {instructor.schedule_status === 'pending' && (
                                                            <span className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-full bg-blue-100 text-blue-800 animate-pulse">
                                                                <Calendar size={12} /> تحديث جدول
                                                            </span>
                                                        )}
                                                        {instructor.profile_update_status === 'pending' && (
                                                            <span className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold rounded-full bg-orange-100 text-orange-800 animate-pulse">
                                                                <FileEdit size={12} /> تحديث بيانات/أسعار
                                                            </span>
                                                        )}
                                                        {instructor.schedule_status !== 'pending' && instructor.profile_update_status !== 'pending' && (
                                                            <span className="flex items-center gap-1 px-2 py-1 text-[10px] text-gray-500 bg-gray-100 rounded-full">
                                                                <CheckCircle2 size={12} /> مستقر
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        <Button 
                                                            as={Link} 
                                                            href={`/instructors/${instructor.id}`} 
                                                            variant={activeTab === 'requests' ? "default" : "ghost"} 
                                                            size={activeTab === 'requests' ? "sm" : "icon"}
                                                            className={activeTab === 'requests' ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}
                                                            title="إدارة الملف والمراجعة"
                                                        >
                                                            {activeTab === 'requests' ? 'مراجعة الطلب' : <UserCog size={20} />}
                                                        </Button>
                                                        
                                                        {activeTab !== 'requests' && (
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                title="حذف المدرب" 
                                                                className="text-destructive hover:bg-destructive/10"
                                                                onClick={() => handleDeleteInstructor(instructor.id, instructor.name)}
                                                            >
                                                                <Trash2 size={20} />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-12 text-muted-foreground italic">
                                                {activeTab === 'requests' ? 'لا توجد طلبات تحديث معلقة حالياً.' : 'لا يوجد مدربون مسجلون.'}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </Tabs>
            
             <Card>
                <Accordion title="إدارة المواعيد المتاحة (تجاوز يدوي)">
                    <CardContent>
                        <p className="text-muted-foreground mb-6 text-sm">
                            هذه الأداة تسمح لك بتعديل مواعيد أي مدرب بشكل مباشر في حالات الطوارئ أو الطلبات اليدوية من العملاء.
                        </p>
                        <AvailabilityManager />
                    </CardContent>
                </Accordion>
             </Card>
        </div>
    );
};

export default AdminInstructorsPage;
