
import React, { useState, useMemo } from 'react';
import { Eye, Sparkles, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAdminServiceOrders } from '../../hooks/queries/admin/useAdminCommunicationQuery';
import { useOrderMutations } from '../../hooks/mutations/useOrderMutations';
import { useToast } from '../../contexts/ToastContext';
import PageLoader from '@alrehla/ui/page-loader';
import type { ServiceOrderWithRelations, OrderStatus } from '../../lib/database.types';
import { Button } from '@alrehla/ui/button';
import StatFilterCard from '../../components/admin/StatFilterCard';
import { Input } from '@alrehla/ui/input';
import { Select } from '@alrehla/ui/native-select';
import ErrorState from '@alrehla/ui/error-state';
import { Card, CardContent, CardHeader, CardTitle } from '@alrehla/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@alrehla/ui/table';
import SortableTableHead from '../../components/admin/ui/SortableTableHead';
import StatusBadge from '@alrehla/ui/status-badge';

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

const orderStatuses: OrderStatus[] = ["بانتظار المراجعة", "قيد التنفيذ", "مكتمل", "ملغي"];
const statusColors: { [key in OrderStatus]?: string } = {
    "بانتظار المراجعة": "bg-indigo-500",
    "قيد التنفيذ": "bg-yellow-500",
    "مكتمل": "bg-green-500",
    "ملغي": "bg-red-500",
};

const AdminServiceOrdersPage: React.FC = () => {
    const router = useRouter();
    const navigate = createNavigate(router);
    const { addToast } = useToast();
    const { data: orders = [], isLoading, error, refetch, isRefetching } = useAdminServiceOrders();
    const { updateServiceOrderStatus } = useOrderMutations();
    
    const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'created_at', direction: 'desc' });

    const statusCounts = useMemo(() => {
        const counts: { [key in OrderStatus]?: number } = {};
        for (const order of orders) {
            counts[order.status] = (counts[order.status] || 0) + 1;
        }
        return counts;
    }, [orders]);

    const sortedAndFilteredOrders = useMemo(() => {
        let filtered = [...orders].filter(o => {
            const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
            const matchesSearch = searchTerm.trim() === '' ||
                o.users?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                o.child_profiles?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                o.id.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesStatus && matchesSearch;
        });
        
        if (sortConfig !== null) {
            filtered.sort((a, b) => {
                const getNestedValue = (obj: any, path: string) => path.split('.').reduce((o, i) => (o ? o[i] : null), obj);
                const aVal = getNestedValue(a, sortConfig.key);
                const bVal = getNestedValue(b, sortConfig.key);
                if (aVal === null || aVal === undefined) return 1;
                if (bVal === null || bVal === undefined) return -1;
                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return filtered;
    }, [orders, statusFilter, searchTerm, sortConfig]);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    if (isLoading) return <PageLoader text="جاري تحميل طلبات الخدمات..." />;
    if (error) return <ErrorState message={(error as Error).message} onRetry={refetch} />;

    return (
        <div className="animate-fadeIn space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-3xl font-extrabold text-foreground">إدارة طلبات الخدمات الإبداعية</h1>
                <Button onClick={() => refetch()} variant="ghost" size="sm" icon={<RefreshCw className={isRefetching ? 'animate-spin' : ''} size={16}/>}>تحديث</Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <StatFilterCard label="الكل" value={orders.length} color="bg-primary" isActive={statusFilter === 'all'} onClick={() => setStatusFilter('all')} />
                {orderStatuses.map(status => (
                    <StatFilterCard 
                        key={status}
                        label={status}
                        value={statusCounts[status] || 0}
                        color={statusColors[status] || 'bg-gray-500'}
                        isActive={statusFilter === status}
                        onClick={() => setStatusFilter(status)}
                    />
                ))}
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles /> قائمة كل الطلبات
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-6 max-w-lg">
                        <Input 
                            type="search"
                            placeholder="ابحث برقم الطلب، اسم العميل، أو اسم الطفل..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <SortableTableHead<ServiceOrderWithRelations> sortKey="users.name" label="العميل" sortConfig={sortConfig} onSort={handleSort} />
                                    <SortableTableHead<ServiceOrderWithRelations> sortKey="child_profiles.name" label="الطفل" sortConfig={sortConfig} onSort={handleSort} />
                                    <SortableTableHead<ServiceOrderWithRelations> sortKey="standalone_services.name" label="الخدمة" sortConfig={sortConfig} onSort={handleSort} />
                                    <SortableTableHead<ServiceOrderWithRelations> sortKey="instructors.name" label="المدرب المسؤول" sortConfig={sortConfig} onSort={handleSort} />
                                    <SortableTableHead<ServiceOrderWithRelations> sortKey="total" label="الإجمالي" sortConfig={sortConfig} onSort={handleSort} />
                                    <SortableTableHead<ServiceOrderWithRelations> sortKey="status" label="الحالة" sortConfig={sortConfig} onSort={handleSort} />
                                    <TableHead>إجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedAndFilteredOrders.map(order => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-semibold">{order.users?.name || 'N/A'}</TableCell>
                                        <TableCell>{order.child_profiles?.name || 'N/A'}</TableCell>
                                        <TableCell className="text-sm">{order.standalone_services?.name || 'N/A'}</TableCell>
                                        <TableCell className="text-sm">{order.instructors?.name || 'غير معين'}</TableCell>
                                        <TableCell className="font-bold">{order.total} ج.م</TableCell>
                                        <TableCell>
                                            {/* عرض الحالة فقط، التعديل يتم في التفاصيل */}
                                            <StatusBadge status={order.status} showIcon />
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" onClick={() => navigate(`/service-orders/${order.id}`)} title="عرض التفاصيل"><Eye size={20} /></Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        {sortedAndFilteredOrders.length === 0 && (
                            <div className="text-center py-12">
                                <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground opacity-20 mb-2" />
                                <p className="text-muted-foreground">لا توجد طلبات تطابق بحثك حالياً.</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminServiceOrdersPage;
