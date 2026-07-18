
import React, { useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useInstructorFinancials } from '../../../hooks/queries/admin/useFinancialsQueries';
import PageLoader from '@alrehla/ui/page-loader';
import ErrorState from '@alrehla/ui/error-state';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@alrehla/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@alrehla/ui/table';
import { Button } from '@alrehla/ui/button';
import { ArrowLeft, DollarSign, CheckCircle, Calendar, TrendingUp, CreditCard, Briefcase } from 'lucide-react';
import { formatDate } from '../../../utils/helpers';
import StatCard from '../../../components/admin/StatCard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@alrehla/ui/tabs';
import Image from '@alrehla/ui/image';

const InstructorFinancialDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { data: allInstructors = [], isLoading, error, refetch } = useInstructorFinancials();

    const instructor = useMemo(() => {
        return allInstructors.find((i: any) => i.id === parseInt(id!));
    }, [allInstructors, id]);

    const financialData = useMemo(() => {
        if (!instructor) return null;

        const history = new Map<string, { earnings: number; paid: number; monthLabel: string; date: Date; transactions: any[] }>();

        const addTransaction = (key: string, date: Date, amount: number, type: 'earning' | 'payout', description: string, source?: string) => {
            if (!history.has(key)) {
                history.set(key, { 
                    earnings: 0, 
                    paid: 0, 
                    monthLabel: date.toLocaleString('ar-EG', { month: 'long', year: 'numeric' }), 
                    date: date,
                    transactions: []
                });
            }
            const monthData = history.get(key)!;
            if (type === 'earning') monthData.earnings += amount;
            else monthData.paid += amount;

            monthData.transactions.push({
                id: Math.random().toString(36).substr(2, 9),
                date,
                amount,
                type,
                description,
                source
            });
        };

        // استخدام any للوصول الآمن للخصائص الديناميكية
        const inst = instructor as any;

        // 1. Earnings from Bookings
        inst.rawCompletedBookings?.forEach((b: any) => {
            const date = new Date(b.booking_date);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            // Ideally calculate exact earning per booking based on historical rate, using current rate/package rate for estimation
            const earning = inst.package_rates?.[b.package_id] || inst.rate_per_session || 0;
            addTransaction(key, date, earning, 'earning', `جلسة: ${b.package_name}`, 'بداية الرحلة');
        });

        // 2. Earnings from Services
        inst.rawCompletedServices?.forEach((s: any) => {
            const date = new Date(s.created_at);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const earning = (s.total * 0.7); // Assuming 70% commission
            addTransaction(key, date, earning, 'earning', `خدمة: ${s.service_name || 'خدمة إبداعية'}`, 'الخدمات');
        });

        // 3. Payouts
        inst.payouts?.forEach((p: any) => {
            const date = new Date(p.payout_date);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            addTransaction(key, date, p.amount, 'payout', p.details || 'تحويل مستحقات', 'الإدارة');
        });

        const monthlyData = Array.from(history.values()).sort((a, b) => b.date.getTime() - a.date.getTime());
        const allTransactions = monthlyData.flatMap(m => m.transactions).sort((a, b) => b.date.getTime() - a.date.getTime());

        return { monthlyData, allTransactions };
    }, [instructor]);

    if (isLoading) return <PageLoader text="جاري تحميل الملف المالي..." />;
    if (error) return <ErrorState message={(error as Error).message} onRetry={refetch} />;
    if (!instructor || !financialData) return <div className="p-8 text-center">لم يتم العثور على بيانات المدرب</div>;
    
    // Cast instructor for display to access dynamic properties safely
    const displayInstructor = instructor as any;

    return (
        <div className="animate-fadeIn space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/financials/instructor-payouts" className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                        <ArrowLeft className="transform rotate-180" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-extrabold text-foreground">{displayInstructor.name}</h1>
                        <p className="text-muted-foreground">الملف المالي التفصيلي</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                     <Image src={displayInstructor.avatar_url || 'https://i.ibb.co/2S4xT8w/male-avatar.png'} alt={displayInstructor.name} className="w-12 h-12 rounded-full border border-border" />
                </div>
            </div>

            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-primary" /> الرصيد الحالي المستحق
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-primary">{displayInstructor.outstandingBalance.toLocaleString()} ج.م</div>
                        <p className="text-xs text-muted-foreground mt-1">جاهز للتحويل</p>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-green-600" /> إجمالي الأرباح (تاريخياً)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-700">{displayInstructor.totalEarnings.toLocaleString()} ج.م</div>
                        <p className="text-xs text-muted-foreground mt-1">من جميع المصادر</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-blue-600" /> إجمالي المدفوعات
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-700">{displayInstructor.totalPaid.toLocaleString()} ج.م</div>
                        <p className="text-xs text-muted-foreground mt-1">تم تحويلها بنجاح</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="overview">
                <TabsList>
                    <TabsTrigger value="overview"><Calendar className="ml-2 h-4 w-4"/> الملخص الشهري</TabsTrigger>
                    <TabsTrigger value="transactions"><TrendingUp className="ml-2 h-4 w-4"/> سجل المعاملات التفصيلي</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                    <Card>
                        <CardHeader>
                            <CardTitle>الأداء الشهري</CardTitle>
                            <CardDescription>ملخص الأرباح والدفعات لكل شهر</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
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
                                        {financialData.monthlyData.length > 0 ? financialData.monthlyData.map((row, idx) => {
                                            const net = row.earnings - row.paid;
                                            return (
                                                <TableRow key={idx}>
                                                    <TableCell className="font-bold">{row.monthLabel}</TableCell>
                                                    <TableCell className="text-center text-green-600 font-semibold">{row.earnings.toLocaleString()} ج.م</TableCell>
                                                    <TableCell className="text-center text-blue-600">{row.paid.toLocaleString()} ج.م</TableCell>
                                                    <TableCell className={`text-center font-bold ltr ${net > 0 ? 'text-orange-500' : 'text-gray-400'}`}>
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
                                        }) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">لا توجد بيانات مالية للعرض.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="transactions">
                    <Card>
                        <CardHeader>
                            <CardTitle>كل المعاملات</CardTitle>
                            <CardDescription>سجل دقيق لكل جلسة، خدمة، أو دفعة مالية</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>التاريخ</TableHead>
                                            <TableHead>نوع المعاملة</TableHead>
                                            <TableHead>الوصف</TableHead>
                                            <TableHead>المصدر</TableHead>
                                            <TableHead className="text-left">المبلغ</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {financialData.allTransactions.length > 0 ? financialData.allTransactions.map((t) => (
                                            <TableRow key={t.id}>
                                                <TableCell className="text-sm text-muted-foreground">{formatDate(t.date.toISOString())}</TableCell>
                                                <TableCell>
                                                    {t.type === 'earning' ? 
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">إيراد</span> :
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">دفعة</span>
                                                    }
                                                </TableCell>
                                                <TableCell className="font-medium">{t.description}</TableCell>
                                                <TableCell className="text-sm text-muted-foreground">{t.source}</TableCell>
                                                <TableCell className={`text-left font-bold font-mono ${t.type === 'earning' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {t.type === 'earning' ? '+' : '-'}{t.amount.toLocaleString()} ج.م
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">لا توجد معاملات مسجلة.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default InstructorFinancialDetailsPage;
