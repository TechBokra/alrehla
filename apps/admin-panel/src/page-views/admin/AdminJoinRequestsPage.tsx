
import React, { useState, useMemo } from 'react';
import { UserPlus, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAdminJoinRequests } from '../../hooks/queries/admin/useAdminCommunicationQuery';
import { useCommunicationMutations } from '../../hooks/mutations/useCommunicationMutations';
import PageLoader from '@alrehla/ui/page-loader';
import { formatDate } from '../../utils/helpers';
import type { JoinRequest, RequestStatus } from '../../lib/database.types';
import { Button } from '@alrehla/ui/button';
import { Select } from '@alrehla/ui/native-select';
import StatFilterCard from '../../components/admin/StatFilterCard';
import { Input } from '@alrehla/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@alrehla/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@alrehla/ui/table';
import ErrorState from '@alrehla/ui/error-state';
import SortableTableHead from '../../components/admin/ui/SortableTableHead';

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

const requestStatuses: RequestStatus[] = ["جديد", "تمت المراجعة", "مقبول", "مرفوض"];
const statusColors: { [key in RequestStatus]: string } = {
    "جديد": "bg-blue-500",
    "تمت المراجعة": "bg-yellow-500",
    "مقبول": "bg-green-500",
    "مرفوض": "bg-red-500",
};

const AdminJoinRequestsPage: React.FC = () => {
    const router = useRouter();
    const navigate = createNavigate(router);
    const { data: requests = [], isLoading, error, refetch } = useAdminJoinRequests();
    const { updateJoinRequestStatus } = useCommunicationMutations();
    
    const [statusFilter, setStatusFilter] = useState<RequestStatus | 'all'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof JoinRequest; direction: 'asc' | 'desc' } | null>({ key: 'created_at', direction: 'desc' });

    const statusCounts = useMemo(() => {
        const counts: { [key in RequestStatus]?: number } = {};
        for (const request of requests) {
            counts[request.status] = (counts[request.status] || 0) + 1;
        }
        return counts;
    }, [requests]);

    const sortedAndFilteredRequests = useMemo(() => {
        let filtered = [...requests].filter(request => {
            const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
            const matchesSearch = searchTerm === '' ||
                request.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                request.role.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesStatus && matchesSearch;
        });

        if (sortConfig !== null) {
            filtered.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
                if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return filtered;
    }, [requests, statusFilter, searchTerm, sortConfig]);

    const handleStatusChange = (requestId: string, newStatus: RequestStatus) => {
        updateJoinRequestStatus.mutate({ requestId, newStatus });
    };

    const handleSort = (key: keyof JoinRequest) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    if (isLoading) return <PageLoader text="جاري تحميل طلبات الانضمام..." />;
    if (error) return <ErrorState message={(error as Error).message} onRetry={refetch} />;

    return (
        <div className="animate-fadeIn space-y-8">
            <h1 className="text-3xl font-extrabold text-foreground">طلبات الانضمام للفريق</h1>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <StatFilterCard label="الكل" value={requests.length} color="bg-primary" isActive={statusFilter === 'all'} onClick={() => setStatusFilter('all')} />
                {requestStatuses.map(status => (
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
                    <CardTitle className="flex items-center gap-2"><UserPlus /> قائمة الطلبات</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-6 max-w-lg">
                        <Input 
                            type="search"
                            placeholder="ابحث بالاسم أو الدور المطلوب..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <SortableTableHead<JoinRequest> sortKey="name" label="الاسم" sortConfig={sortConfig} onSort={handleSort} />
                                    <SortableTableHead<JoinRequest> sortKey="role" label="الدور المطلوب" sortConfig={sortConfig} onSort={handleSort} />
                                    <SortableTableHead<JoinRequest> sortKey="created_at" label="التاريخ" sortConfig={sortConfig} onSort={handleSort} />
                                    <SortableTableHead<JoinRequest> sortKey="status" label="الحالة" sortConfig={sortConfig} onSort={handleSort} />
                                    <TableHead>إجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedAndFilteredRequests.map(request => (
                                    <TableRow key={request.id}>
                                        <TableCell className="font-semibold">{request.name}</TableCell>
                                        <TableCell>{request.role}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{formatDate(request.created_at)}</TableCell>
                                        <TableCell className="min-w-[150px]">
                                            <Select value={request.status} onChange={e => handleStatusChange(request.id, e.target.value as RequestStatus)}>
                                                {requestStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" onClick={() => navigate(`/join-requests/${request.id}`)} title="عرض التفاصيل"><Eye size={20} /></Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                            {sortedAndFilteredRequests.length === 0 && <p className="text-center py-8 text-muted-foreground">لا توجد طلبات تطابق بحثك.</p>}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminJoinRequestsPage;
