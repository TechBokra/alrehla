
import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Users, Plus, UserCog, ArrowUp, ArrowDown, Clock, AlertCircle } from 'lucide-react';
import { useAdminInstructors } from '../../hooks/queries/admin/useAdminInstructorsQuery';
import PageLoader from '@alrehla/ui/page-loader';
import AvailabilityManager from '../../components/admin/AvailabilityManager';
import { Button } from '@alrehla/ui/button';
import ErrorState from '@alrehla/ui/error-state';
import { Card, CardContent, CardHeader, CardTitle } from '@alrehla/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@alrehla/ui/table';
import Accordion from '@alrehla/ui/accordion';
import type { Instructor } from '../../lib/database.types';

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

// Main Page Component
const AdminInstructorsPage: React.FC = () => {
    const router = useRouter();
    const navigate = createNavigate(router);
    const { data: instructors = [], isLoading, error, refetch } = useAdminInstructors();
    const [sortConfig, setSortConfig] = useState<{ key: keyof Instructor; direction: 'asc' | 'desc' } | null>({ key: 'name', direction: 'asc' });

    const sortedInstructors = useMemo(() => {
        let sortableItems = [...instructors];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
                if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [instructors, sortConfig]);

    const handleSort = (key: keyof Instructor) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const SortableTh: React.FC<{ sortKey: keyof Instructor; label: string }> = ({ sortKey, label }) => (
        <TableHead>
            <Button variant="ghost" onClick={() => handleSort(sortKey)} className="px-0 h-auto py-0">
                <div className="flex items-center">
                   <span>{label}</span>
                    {sortConfig?.key === sortKey && (
                        sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4 mr-2" /> : <ArrowDown className="h-4 w-4 mr-2" />
                    )}
                </div>
            </Button>
        </TableHead>
    );


    if (isLoading) return <PageLoader text="جاري تحميل بيانات المدربين..." />;
    if (error) return <ErrorState message={(error as Error).message} onRetry={refetch} />;

    return (
        <div className="animate-fadeIn space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-extrabold text-foreground">إدارة المدربين</h1>
                <Button onClick={() => navigate('/instructors/new')} icon={<Plus size={18} />}>
                    إضافة مدرب
                </Button>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users /> قائمة المدربين</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <SortableTh sortKey="name" label="المدرب" />
                                <SortableTh sortKey="specialty" label="التخصص" />
                                <SortableTh sortKey="schedule_status" label="حالة الجدول" />
                                <TableHead>إجراءات</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedInstructors.map(instructor => (
                                <TableRow key={instructor.id}>
                                    <TableCell className="flex items-center gap-3">
                                        <img src={instructor.avatar_url || 'https://i.ibb.co/2S4xT8w/male-avatar.png'} alt={instructor.name} className="w-10 h-10 rounded-full object-cover" loading="lazy" />
                                        <span className="font-medium text-foreground">{instructor.name}</span>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{instructor.specialty}</TableCell>
                                     <TableCell>
                                        {instructor.schedule_status === 'pending' ? (
                                             <div className="flex items-center gap-2">
                                                <span className="px-2 py-1 text-xs font-bold rounded-full bg-yellow-100 text-yellow-800 flex items-center gap-1 animate-pulse">
                                                    <Clock size={12} /> تحديث معلق
                                                </span>
                                                <Button 
                                                    as={Link} 
                                                    href={`/instructors/${instructor.id}`} 
                                                    size="sm" 
                                                    variant="outline" 
                                                    className="h-7 text-xs border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                                                >
                                                    مراجعة الطلب
                                                </Button>
                                             </div>
                                        ) : (
                                            <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                                                instructor.schedule_status === 'approved' ? 'bg-green-100 text-green-800' :
                                                instructor.schedule_status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-muted text-muted-foreground'
                                            }`}>
                                                {instructor.schedule_status === 'approved' ? 'معتمد' :
                                                 instructor.schedule_status === 'rejected' ? 'مرفوض' : 'غير محدد'}
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Button as={Link} href={`/instructors/${instructor.id}`} variant="ghost" size="icon" title="إدارة ملف المدرب">
                                            <UserCog size={20} />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
              </CardContent>
            </Card>
            
             <Card>
                <Accordion title="إدارة المواعيد المتاحة (تجاوز يدوي)">
                    <CardContent>
                        <p className="text-muted-foreground mb-6">
                            اختر مدربًا ثم اختر يومًا من التقويم لإضافة أو حذف المواعيد المتاحة فيه بشكل مباشر. هذا الإجراء يتجاوز نظام موافقة الجداول.
                        </p>
                        <AvailabilityManager />
                    </CardContent>
                </Accordion>
             </Card>
        </div>
    );
};

export default AdminInstructorsPage;
