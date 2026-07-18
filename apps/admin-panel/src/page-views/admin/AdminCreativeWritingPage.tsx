
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Eye, Search, RefreshCw, Archive, CheckCircle2 } from 'lucide-react';
import { useAdminRawCwBookings } from '../../hooks/queries/admin/useAdminBookingsQuery';
import { useBookingMutations } from '../../hooks/mutations/useBookingMutations';
import PageLoader from '@alrehla/ui/page-loader';
import { getStatusColor, formatDate } from '../../utils/helpers';
import type { BookingStatus } from '../../lib/database.types';
import { Button } from '@alrehla/ui/button';
import { Input } from '@alrehla/ui/input';
import { Select } from '@alrehla/ui/native-select';
import { Card, CardContent } from '@alrehla/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@alrehla/ui/table';
import ErrorState from '@alrehla/ui/error-state';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@alrehla/ui/tabs';
import { useDebounce } from '../../hooks/useDebounce';

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

const AdminCreativeWritingPage: React.FC = () => {
    const router = useRouter();
    const navigate = createNavigate(router);
    const { updateBookingStatus } = useBookingMutations();

    // Pagination & Search State
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 500);
    const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');

    const { data, isLoading, error, refetch, isRefetching } = useAdminRawCwBookings({
        page,
        pageSize,
        search: debouncedSearch,
        statusFilter: activeTab
    });

    const bookings = data?.bookings || [];
    const totalCount = data?.count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    if (error) return <ErrorState message={(error as Error).message} onRetry={refetch} />;

    return (
        <div className="animate-fadeIn space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-extrabold text-foreground">إدارة الحجوزات</h1>
                <Button onClick={() => refetch()} variant="outline" size="sm" icon={<RefreshCw className={isRefetching ? 'animate-spin' : ''} size={16}/>}>تحديث</Button>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as any); setPage(1); }}>
                <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                    <TabsList>
                        <TabsTrigger value="active" className="gap-2"><CheckCircle2 size={16}/> الحجوزات النشطة</TabsTrigger>
                        <TabsTrigger value="archived" className="gap-2"><Archive size={16}/> الأرشيف (الملغاة)</TabsTrigger>
                    </TabsList>
                    <div className="relative w-full md:w-80">
                        <Input 
                            placeholder="ابحث برقم الحجز..." 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                        />
                    </div>
                </div>

                <Card>
                    <CardContent className="pt-6 px-0">
                        {isLoading ? <div className="p-8"><PageLoader text="جاري تحميل الحجوزات..." /></div> : (
                            <>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>الطالب</TableHead>
                                                <TableHead>المدرب</TableHead>
                                                <TableHead>الباقة</TableHead>
                                                <TableHead>الحالة</TableHead>
                                                <TableHead>تاريخ البداية</TableHead>
                                                <TableHead>إجراءات</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {bookings.length > 0 ? (
                                                bookings.map((booking: any) => (
                                                    <TableRow key={booking.id}>
                                                        <TableCell className="font-bold">{booking.child_profiles?.name || 'غير معروف'}</TableCell>
                                                        <TableCell>{booking.instructors?.name || 'غير محدد'}</TableCell>
                                                        <TableCell className="text-xs">{booking.package_name}</TableCell>
                                                        <TableCell>
                                                            <Select
                                                                value={booking.status}
                                                                onChange={e => updateBookingStatus.mutate({ bookingId: booking.id, newStatus: e.target.value as BookingStatus })}
                                                                className={`p-1 text-xs font-bold ${getStatusColor(booking.status)}`}
                                                            >
                                                                {["بانتظار الدفع", "مؤكد", "مكتمل", "ملغي"].map(s => <option key={s} value={s}>{s}</option>)}
                                                            </Select>
                                                        </TableCell>
                                                        <TableCell className="text-xs">{formatDate(booking.booking_date)}</TableCell>
                                                        <TableCell>
                                                            <Button variant="ghost" size="icon" onClick={() => navigate(`/creative-writing/bookings/${booking.id}`)}><Eye size={18}/></Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">لا توجد سجلات في هذا التبويب.</TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                                
                                {/* Pagination Controls */}
                                <div className="flex justify-between items-center p-4 border-t">
                                    <div className="text-sm text-gray-500">
                                        صفحة {page} من {totalPages || 1} (إجمالي {totalCount} حجز)
                                    </div>
                                    <div className="flex gap-2">
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                        >
                                            السابق
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                            disabled={page >= totalPages}
                                        >
                                            التالي
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </Tabs>
        </div>
    );
};

export default AdminCreativeWritingPage;
