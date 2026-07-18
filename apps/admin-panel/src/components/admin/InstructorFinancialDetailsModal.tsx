import React, { useMemo } from 'react';
import { Download, Calendar, DollarSign, TrendingUp, CheckCircle } from 'lucide-react';
import Modal from '@alrehla/ui/modal';
import { Button } from '@alrehla/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@alrehla/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@alrehla/ui/card';
import { formatDate } from '../../utils/helpers';

interface InstructorFinancialDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    instructor: any;
}

const InstructorFinancialDetailsModal: React.FC<InstructorFinancialDetailsModalProps> = ({ isOpen, onClose, instructor }) => {
    const financialHistory = useMemo(() => {
        if (!instructor) return [];

        const history = new Map<string, { earnings: number; paid: number; monthLabel: string; date: Date }>();

        // Helper to get YYYY-MM key
        const getMonthKey = (dateString: string) => {
            const date = new Date(dateString);
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        };

        const getMonthLabel = (dateString: string) => {
            const date = new Date(dateString);
            return date.toLocaleString('ar-EG', { month: 'long', year: 'numeric' });
        };

        // Process Earnings (Bookings)
        instructor.rawCompletedBookings?.forEach((b: any) => {
            const key = getMonthKey(b.booking_date);
            if (!history.has(key)) history.set(key, { earnings: 0, paid: 0, monthLabel: getMonthLabel(b.booking_date), date: new Date(b.booking_date) });
            
            // Calculate earnings based on package rate or session rate
            // Note: Ideally this logic should match the main financial hook perfectly
            const earning = instructor.package_rates?.[b.package_id] || instructor.rate_per_session || 0; 
            // Simplified calculation for visual purposes, assumes session rate if package rate not found
            
            history.get(key)!.earnings += earning;
        });

        // Process Earnings (Services)
        instructor.rawCompletedServices?.forEach((s: any) => {
            const key = getMonthKey(s.created_at);
            if (!history.has(key)) history.set(key, { earnings: 0, paid: 0, monthLabel: getMonthLabel(s.created_at), date: new Date(s.created_at) });
            
            const earning = (s.total * 0.7); // Assuming 70% commission
            history.get(key)!.earnings += earning;
        });

        // Process Payouts
        instructor.payouts?.forEach((p: any) => {
            const key = getMonthKey(p.payout_date);
            if (!history.has(key)) history.set(key, { earnings: 0, paid: 0, monthLabel: getMonthLabel(p.payout_date), date: new Date(p.payout_date) });
            history.get(key)!.paid += p.amount;
        });

        return Array.from(history.values()).sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [instructor]);

    if (!instructor) return null;

    const currentMonthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const currentMonthStats = financialHistory.find(h => {
        const hKey = `${h.date.getFullYear()}-${String(h.date.getMonth() + 1).padStart(2, '0')}`;
        return hKey === currentMonthKey;
    });

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`الملف المالي: ${instructor.name}`}
            size="2xl"
            footer={<Button onClick={onClose}>إغلاق</Button>}
        >
            <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-blue-50 border-blue-100">
                        <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                            <p className="text-sm text-blue-600 font-semibold mb-1">الرصيد الحالي المستحق</p>
                            <p className="text-2xl font-bold text-blue-800">{instructor.outstandingBalance.toLocaleString()} ج.م</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-green-50 border-green-100">
                        <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                            <p className="text-sm text-green-600 font-semibold mb-1">أرباح هذا الشهر</p>
                            <p className="text-2xl font-bold text-green-800">{(currentMonthStats?.earnings || 0).toLocaleString()} ج.م</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gray-50 border-gray-100">
                        <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                            <p className="text-sm text-gray-600 font-semibold mb-1">إجمالي المدفوعات تاريخياً</p>
                            <p className="text-2xl font-bold text-gray-800">{instructor.totalPaid.toLocaleString()} ج.م</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Monthly Breakdown Table */}
                <div>
                    <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                        <Calendar className="text-gray-500" size={20}/>
                        سجل الأداء الشهري
                    </h3>
                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-right">الشهر</TableHead>
                                    <TableHead className="text-center">الأرباح المكتسبة</TableHead>
                                    <TableHead className="text-center">المدفوعات المستلمة</TableHead>
                                    <TableHead className="text-center">صافي الشهر</TableHead>
                                    <TableHead className="text-center">الحالة</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {financialHistory.length > 0 ? (
                                    financialHistory.map((row, idx) => {
                                        const net = row.earnings - row.paid;
                                        return (
                                            <TableRow key={idx}>
                                                <TableCell className="font-medium">{row.monthLabel}</TableCell>
                                                <TableCell className="text-center text-green-600 font-semibold">{row.earnings.toLocaleString()} ج.م</TableCell>
                                                <TableCell className="text-center text-blue-600">{row.paid.toLocaleString()} ج.م</TableCell>
                                                <TableCell className={`text-center font-bold ${net > 0 ? 'text-orange-500' : 'text-gray-400'}`}>
                                                    {net > 0 ? `+${net.toLocaleString()}` : net === 0 ? '-' : net.toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {net > 0 ? (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                            مستحق
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                            <CheckCircle size={12} className="mr-1" />
                                                            خالص
                                                        </span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            لا يوجد سجل مالي متاح.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default InstructorFinancialDetailsModal;
