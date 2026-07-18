import React, { useMemo, useState } from 'react';
import { useTransactionsLog } from '../../../hooks/queries/admin/useFinancialsQueries';
import PageLoader from '@alrehla/ui/page-loader';
import ErrorState from '@alrehla/ui/error-state';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@alrehla/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@alrehla/ui/table';
import { formatDate } from '../../../utils/helpers';
import { Input } from '@alrehla/ui/input';
import { Select } from '@alrehla/ui/native-select';

const TransactionsLogPage: React.FC = () => {
    const { data, isLoading, error, refetch } = useTransactionsLog();
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    const transactions = useMemo(() => {
        if (!data) return [];
        const { orders, bookings, serviceOrders, payouts, instructors } = data;

        const income = [
            ...orders.filter((o: any) => o.status === 'تم التسليم' || o.status === 'مكتمل').map((o: any) => ({ type: 'in', date: o.order_date, amount: o.total, description: `طلب قصة #${o.id.substring(0, 6)}` })),
            ...bookings.filter((b: any) => b.status === 'مكتمل').map((b: any) => ({ type: 'in', date: b.created_at, amount: b.total, description: `حجز باقة ${b.package_name}` })),
            ...serviceOrders.filter((so: any) => so.status === 'مكتمل').map((so: any) => ({ type: 'in', date: so.created_at, amount: so.total, description: `طلب خدمة #${so.id.substring(0, 6)}` })),
        ];

        const outcome = [
            ...payouts.map((p: any) => {
                const instructorName = instructors.find((i:any) => i.id === p.instructor_id)?.name || `ID: ${p.instructor_id}`;
                return { type: 'out', date: p.payout_date, amount: p.amount, description: `دفعة للمدرب ${instructorName}` };
            })
        ];

        return [...income, ...outcome].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [data]);
    
    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const matchesFilter = filter === 'all' || t.type === filter;
            const matchesSearch = searchTerm === '' || t.description.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesFilter && matchesSearch;
        });
    }, [transactions, filter, searchTerm]);

    if (isLoading) return <PageLoader />;
    if (error) return <ErrorState message={(error as Error).message} onRetry={refetch} />;

    return (
        <Card>
            <CardHeader>
                <CardTitle>سجل المعاملات المالية</CardTitle>
            </CardHeader>
            <CardContent>
                 <div className="flex gap-4 mb-4">
                    <Input placeholder="بحث في الوصف..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    <Select value={filter} onChange={e => setFilter(e.target.value)}>
                        <option value="all">الكل</option>
                        <option value="in">إيرادات</option>
                        <option value="out">مدفوعات</option>
                    </Select>
                </div>
                <div className="overflow-x-auto max-h-[70vh]">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead></TableHead>
                                <TableHead>التاريخ</TableHead>
                                <TableHead>الوصف</TableHead>
                                <TableHead>المبلغ</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTransactions.map((t, index) => (
                                <TableRow key={index}>
                                    <TableCell>
                                        {t.type === 'in' 
                                            ? <TrendingUp className="text-green-500" />
                                            : <TrendingDown className="text-red-500" />
                                        }
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{formatDate(t.date)}</TableCell>
                                    <TableCell>{t.description}</TableCell>
                                    <TableCell className={`font-bold ${t.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                                        {t.amount.toLocaleString()} ج.م
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
};

export default TransactionsLogPage;
