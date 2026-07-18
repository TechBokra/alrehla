
import React, { useState, useMemo } from 'react';
import { MessageSquare, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAdminSupportTickets } from '../../hooks/queries/admin/useAdminCommunicationQuery';
import { useCommunicationMutations } from '../../hooks/mutations/useCommunicationMutations';
import PageLoader from '@alrehla/ui/page-loader';
import { formatDate } from '../../utils/helpers';
import type { SupportTicket, TicketStatus } from '../../lib/database.types';
import { Button } from '@alrehla/ui/button';
import { Select } from '@alrehla/ui/native-select';
import StatFilterCard from '../../components/admin/StatFilterCard';
import { Input } from '@alrehla/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@alrehla/ui/card';
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

const ticketStatuses: TicketStatus[] = ["جديدة", "تمت المراجعة", "مغلقة"];
const statusColors: { [key in TicketStatus]: string } = {
    "جديدة": "bg-blue-500",
    "تمت المراجعة": "bg-yellow-500",
    "مغلقة": "bg-green-500",
};

const AdminSupportPage: React.FC = () => {
    const router = useRouter();
    const navigate = createNavigate(router);
    const { data: tickets = [], isLoading, error, refetch } = useAdminSupportTickets();
    const { updateSupportTicketStatus } = useCommunicationMutations();
    
    const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof SupportTicket; direction: 'asc' | 'desc' } | null>({ key: 'created_at', direction: 'desc' });


    const statusCounts = useMemo(() => {
        const counts: { [key in TicketStatus]?: number } = {};
        for (const ticket of tickets) {
            counts[ticket.status] = (counts[ticket.status] || 0) + 1;
        }
        return counts;
    }, [tickets]);

    const sortedAndFilteredTickets = useMemo(() => {
        let filtered = [...tickets].filter(ticket => {
            const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
            const matchesSearch = searchTerm === '' ||
                ticket.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ticket.subject.toLowerCase().includes(searchTerm.toLowerCase());
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
    }, [tickets, statusFilter, searchTerm, sortConfig]);

    const handleStatusChange = (ticketId: string, newStatus: TicketStatus) => {
        updateSupportTicketStatus.mutate({ ticketId, newStatus });
    };

    const handleSort = (key: keyof SupportTicket) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    if (isLoading) return <PageLoader text="جاري تحميل رسائل الدعم..." />;
    if (error) return <ErrorState message={(error as Error).message} onRetry={refetch} />;

    return (
        <div className="animate-fadeIn space-y-8">
            <h1 className="text-3xl font-extrabold text-foreground">رسائل الدعم</h1>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatFilterCard label="الكل" value={tickets.length} color="bg-primary" isActive={statusFilter === 'all'} onClick={() => setStatusFilter('all')} />
                {ticketStatuses.map(status => (
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
                    <CardTitle className="flex items-center gap-2"><MessageSquare /> قائمة الرسائل</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-6 max-w-lg">
                        <Input 
                            type="search"
                            placeholder="ابحث بالاسم أو الموضوع..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <SortableTableHead<SupportTicket> sortKey="name" label="الاسم" sortConfig={sortConfig} onSort={handleSort} />
                                    <SortableTableHead<SupportTicket> sortKey="subject" label="الموضوع" sortConfig={sortConfig} onSort={handleSort} />
                                    <SortableTableHead<SupportTicket> sortKey="created_at" label="التاريخ" sortConfig={sortConfig} onSort={handleSort} />
                                    <SortableTableHead<SupportTicket> sortKey="status" label="الحالة" sortConfig={sortConfig} onSort={handleSort} />
                                    <TableHead>إجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedAndFilteredTickets.map(ticket => (
                                    <TableRow key={ticket.id}>
                                        <TableCell className="font-semibold">{ticket.name}</TableCell>
                                        <TableCell>{ticket.subject}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{formatDate(ticket.created_at)}</TableCell>
                                        <TableCell className="min-w-[150px]">
                                            <Select value={ticket.status} onChange={e => handleStatusChange(ticket.id, e.target.value as TicketStatus)}>
                                                {ticketStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" onClick={() => navigate(`/support/${ticket.id}`)} title="عرض التفاصيل"><Eye size={20} /></Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                            {sortedAndFilteredTickets.length === 0 && <p className="text-center py-8 text-muted-foreground">لا توجد رسائل دعم تطابق بحثك.</p>}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminSupportPage;
