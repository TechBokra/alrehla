
import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useInstructorFinancials } from '../../../hooks/queries/admin/useFinancialsQueries';
import PageLoader from '@alrehla/ui/page-loader';
import ErrorState from '@alrehla/ui/error-state';
import { DollarSign, FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@alrehla/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@alrehla/ui/table';
import { Button } from '@alrehla/ui/button';
import PayoutModal from '../../../components/admin/PayoutModal';
import SortableTableHead from '../../../components/admin/ui/SortableTableHead';

const InstructorPayoutsPage: React.FC = () => {
    const { data: instructorFinancials = [], isLoading, error, refetch } = useInstructorFinancials();
    const [payoutModalOpen, setPayoutModalOpen] = useState(false);
    const [selectedInstructor, setSelectedInstructor] = useState<any | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'outstandingBalance', direction: 'desc' });
    
    const sortedInstructorFinancials = useMemo(() => {
        let sortableItems = [...instructorFinancials];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const aVal = a[sortConfig.key as keyof typeof a];
                const bVal = b[sortConfig.key as keyof typeof b];
                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [instructorFinancials, sortConfig]);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleOpenPayoutModal = (instructor: any) => {
        setSelectedInstructor(instructor);
        setPayoutModalOpen(true);
    };

    if (isLoading) return <PageLoader text="جاري احتساب المستحقات..." />;
    if (error) return <ErrorState message={(error as Error).message} onRetry={refetch} />;

    return (
        <>
            {selectedInstructor && <PayoutModal isOpen={payoutModalOpen} onClose={() => setPayoutModalOpen(false)} instructor={selectedInstructor} amount={selectedInstructor.outstandingBalance} />}
            
            <Card>
                <CardHeader>
                    <CardTitle>كشف حساب المدربين</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <SortableTableHead sortKey="name" label="اسم المدرب" sortConfig={sortConfig} onSort={handleSort} />
                                    <SortableTableHead sortKey="totalEarnings" label="إجمالي الأرباح المكتسبة" sortConfig={sortConfig} onSort={handleSort} />
                                    <SortableTableHead sortKey="totalPaid" label="إجمالي المحول له" sortConfig={sortConfig} onSort={handleSort} />
                                    <SortableTableHead sortKey="outstandingBalance" label="الرصيد المستحق" sortConfig={sortConfig} onSort={handleSort} />
                                    <TableHead>الحالة</TableHead>
                                    <TableHead>إجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedInstructorFinancials.map(inst => (
                                    <TableRow key={inst.id}>
                                        <TableCell className="font-semibold">{inst.name}</TableCell>
                                        <TableCell>{inst.totalEarnings.toLocaleString()} ج.م</TableCell>
                                        <TableCell className="text-muted-foreground">{inst.totalPaid.toLocaleString()} ج.م</TableCell>
                                        <TableCell className={`font-bold text-lg ${inst.outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                            {inst.outstandingBalance.toLocaleString()} ج.م
                                        </TableCell>
                                        <TableCell>
                                            {inst.outstandingBalance > 0 ? (
                                                <span className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded-full w-fit">
                                                    <AlertTriangle size={12}/> يستحق الدفع
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full w-fit">
                                                    <CheckCircle size={12}/> خالص
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="flex items-center gap-2">
                                            <Button size="sm" onClick={() => handleOpenPayoutModal(inst)} icon={<DollarSign size={16} />} disabled={inst.outstandingBalance <= 0} variant={inst.outstandingBalance > 0 ? 'default' : 'secondary'}>
                                                تسجيل دفعة
                                            </Button>
                                            <Button as={Link} href={`/financials/instructor-payouts/${inst.id}`} size="sm" variant="ghost" icon={<FileText size={16} />}>
                                                كشف تفصيلي
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </>
    );
};

export default InstructorPayoutsPage;
