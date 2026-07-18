
import React, { useState } from 'react';
import { Clock, CheckCircle2, Archive, Search, RefreshCw, Eye } from 'lucide-react';
import { useAdminOrders } from '../../hooks/queries/admin/useAdminEnhaLakQuery';
import { useOrderMutations } from '../../hooks/mutations/useOrderMutations';
import PageLoader from '@alrehla/ui/page-loader';
import ErrorState from '@alrehla/ui/error-state';
import type { OrderWithRelations } from '../../lib/database.types';
import { Card, CardContent } from '@alrehla/ui/card';
import { Button } from '@alrehla/ui/button';
import { Input } from '@alrehla/ui/input';
import { useRouter } from 'next/navigation';
import StatusBadge from '@alrehla/ui/status-badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@alrehla/ui/tabs';
import DataTable from '../../components/admin/ui/DataTable';
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

const AdminOrdersPage: React.FC = () => {
    const router = useRouter();
    const navigate = createNavigate(router);
    
    // Server-side State
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 500);
    const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'cancelled'>('active');

    const { data, isLoading, error, refetch, isRefetching } = useAdminOrders({
        page,
        pageSize,
        search: debouncedSearch,
        statusFilter: activeTab
    });
    
    const orders = data?.orders || [];
    const totalCount = data?.count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    const { bulkDeleteOrders } = useOrderMutations();

    if (error) return <ErrorState message={(error as Error).message} onRetry={refetch} />;

    return (
        <div className="animate-fadeIn space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-extrabold text-foreground">إدارة طلبات "إنها لك"</h1>
                <Button onClick={() => refetch()} variant="outline" size="sm" icon={<RefreshCw className={isRefetching ? "animate-spin" : ""} size={16} />}>
                    تحديث البيانات
                </Button>
            </div>
            
            <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val as any); setPage(1); }} className="w-full">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
                    <TabsList>
                        <TabsTrigger value="active" className="gap-2">
                            <Clock size={16} /> الطلبات الجارية
                        </TabsTrigger>
                        <TabsTrigger value="completed" className="gap-2 text-green-700 data-[state=active]:text-green-800">
                            <CheckCircle2 size={16} /> سجل المكتملة
                        </TabsTrigger>
                        <TabsTrigger value="cancelled" className="gap-2 text-red-700 data-[state=active]:text-red-800">
                            <Archive size={16} /> الطلبات الملغاة
                        </TabsTrigger>
                    </TabsList>

                    <div className="relative w-full lg:w-72">
                        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <Input 
                            placeholder="بحث برقم الطلب..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pr-10"
                        />
                    </div>
                </div>

                <Card>
                    <CardContent className="p-0">
                        {isLoading ? <div className="p-8"><PageLoader text="جاري تحميل الطلبات..." /></div> : (
                            <>
                                <DataTable<OrderWithRelations>
                                    data={orders}
                                    columns={[
                                        {
                                            accessorKey: 'users.name',
                                            header: 'العميل',
                                            cell: ({ row }) => (
                                                <div>
                                                    <div className="font-medium">{row.users?.name || 'غير معروف'}</div>
                                                    <div className="text-[10px] text-muted-foreground">{row.users?.email}</div>
                                                </div>
                                            )
                                        },
                                        {
                                            accessorKey: 'child_profiles.name',
                                            header: 'الطفل',
                                            cell: ({ row }) => row.child_profiles?.name || '-'
                                        },
                                        {
                                            accessorKey: 'item_summary',
                                            header: 'الملخص',
                                            cell: ({ value }) => <span className="text-sm truncate max-w-xs block" title={value}>{value}</span>
                                        },
                                        {
                                            accessorKey: 'total',
                                            header: 'الإجمالي',
                                            cell: ({ value }) => <span className="font-bold">{value} ج.م</span>
                                        },
                                        {
                                            accessorKey: 'status',
                                            header: 'الحالة',
                                            cell: ({ value }) => <StatusBadge status={value} showIcon />
                                        }
                                    ]}
                                    renderRowActions={(order) => (
                                        <Button variant="ghost" size="icon" onClick={() => navigate(`/orders/${order.id}`)} title="عرض ومراجعة">
                                            <Eye size={18} />
                                        </Button>
                                    )}
                                />
                                
                                {/* Pagination Controls */}
                                <div className="flex justify-between items-center p-4 border-t">
                                    <div className="text-sm text-gray-500">
                                        صفحة {page} من {totalPages || 1} (إجمالي {totalCount} طلب)
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

export default AdminOrdersPage;
