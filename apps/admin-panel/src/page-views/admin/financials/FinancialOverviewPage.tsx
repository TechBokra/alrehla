
import React, { useMemo } from 'react';
import { useFinancialsOverview } from '../../../hooks/queries/admin/useFinancialsQueries';
import PageLoader from '@alrehla/ui/page-loader';
import ErrorState from '@alrehla/ui/error-state';
import StatCard from '../../../components/admin/StatCard';
import { DollarSign, TrendingUp, TrendingDown, Clock, AlertCircle, Wallet } from 'lucide-react';
import BarChart from '../../../components/admin/BarChart';
import LineChart from '../../../components/admin/LineChart';
import { Card, CardHeader, CardTitle, CardContent } from '@alrehla/ui/card';

const FinancialOverviewPage: React.FC = () => {
    const { data, isLoading, error, refetch } = useFinancialsOverview();

    const stats = useMemo(() => {
        if (!data) return null;

        const { orders, bookings, serviceOrders, subscriptions, payouts, subscriptionPlans } = data;
        
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // 1. Recognized Revenue (الإيرادات المحققة - Completed/Delivered)
        // Only count money that is "earned" (service delivered)
        const revenueEnhaLak = orders
            .filter((o: any) => o.status === 'تم التسليم' || o.status === 'مكتمل')
            .reduce((sum: number, o: any) => sum + o.total, 0);
            
        const revenueCreativeWriting = bookings
            .filter((b: any) => b.status === 'مكتمل')
            .reduce((sum: number, b: any) => sum + b.total, 0) + 
            serviceOrders
            .filter((o: any) => o.status === 'مكتمل')
            .reduce((sum: number, o: any) => sum + o.total, 0);
            
        const totalRealizedRevenue = revenueEnhaLak + revenueCreativeWriting;

        // 2. Pending Revenue (إيرادات تحت التنفيذ - Processing)
        // Money in the system but service not yet fully delivered/confirmed
        const pendingRevenueEnhaLak = orders
            .filter((o: any) => ['بانتظار الدفع', 'بانتظار المراجعة', 'قيد التجهيز', 'قيد التنفيذ', 'يحتاج مراجعة', 'تم الشحن'].includes(o.status))
            .reduce((sum: number, o: any) => sum + o.total, 0);

        const pendingRevenueCreativeWriting = bookings
            .filter((b: any) => ['بانتظار الدفع', 'مؤكد'].includes(b.status))
            .reduce((sum: number, b: any) => sum + b.total, 0) +
            serviceOrders
            .filter((o: any) => ['بانتظار المراجعة', 'قيد التنفيذ'].includes(o.status))
            .reduce((sum: number, o: any) => sum + o.total, 0);

        const totalPendingRevenue = pendingRevenueEnhaLak + pendingRevenueCreativeWriting;

        // 3. MRR (Monthly Recurring Revenue - Subscriptions)
        const mrr = subscriptions.filter((s: any) => s.status === 'active').reduce((sum: number, s: any) => {
             const plan = subscriptionPlans.find((p: any) => p.name === s.plan_name);
             return sum + (plan?.price_per_month || 0);
        }, 0);
        
        // 4. Payouts (Expenses)
        const totalPayouts = payouts.reduce((sum: number, p: any) => sum + p.amount, 0);
        const payoutsThisMonth = payouts.filter((p: any) => new Date(p.payout_date) >= startOfMonth).reduce((sum: number, p: any) => sum + p.amount, 0);

        // 5. Net Profit (Estimate: Realized Revenue - Payouts)
        const netProfit = totalRealizedRevenue - totalPayouts;

        // Mock data for chart visualization
        const revenueOverTimeData = [
            { label: 'يناير', value: totalRealizedRevenue * 0.4 },
            { label: 'فبراير', value: totalRealizedRevenue * 0.6 },
            { label: 'مارس', value: totalRealizedRevenue * 0.8 },
            { label: 'أبريل', value: totalRealizedRevenue },
        ]; 

        return {
            totalRealizedRevenue,
            totalPendingRevenue,
            mrr,
            payoutsThisMonth,
            revenueEnhaLak,
            revenueCreativeWriting,
            revenueOverTimeData,
            netProfit
        };
    }, [data]);

    if (isLoading) return <PageLoader text="جاري تحليل البيانات المالية..." />;
    if (error) return <ErrorState message={(error as Error).message} onRetry={refetch} />;
    if (!stats) return null;

    return (
        <div className="space-y-8 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="الإيرادات المحققة (تم التنفيذ)" 
                    value={`${stats.totalRealizedRevenue.toLocaleString()} ج.م`} 
                    icon={<DollarSign className="text-green-600" />} 
                />
                <StatCard 
                    title="إيرادات قيد التحصيل/التنفيذ" 
                    value={`${stats.totalPendingRevenue.toLocaleString()} ج.م`} 
                    icon={<Clock className="text-orange-500" />} 
                />
                <StatCard 
                    title="مدفوعات المدربين (هذا الشهر)" 
                    value={`${stats.payoutsThisMonth.toLocaleString()} ج.م`} 
                    icon={<TrendingDown className="text-red-500" />} 
                />
                 <StatCard 
                    title="صافي الربح التقديري" 
                    value={`${stats.netProfit.toLocaleString()} ج.م`} 
                    icon={<Wallet className="text-blue-600" />} 
                />
            </div>
            
            {stats.totalPendingRevenue > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="text-orange-600 w-5 h-5 mt-0.5" />
                    <div>
                        <h4 className="font-bold text-orange-800 text-sm">تنبيه التدفق النقدي</h4>
                        <p className="text-sm text-orange-700 mt-1">
                            لديك عمليات بقيمة <span className="font-bold">{stats.totalPendingRevenue.toLocaleString()} ج.م</span> قيد المعالجة. تأكد من متابعة الطلبات والحجوزات العالقة لتحويلها إلى إيرادات محققة.
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2">
                    <CardHeader><CardTitle>مؤشر نمو الإيرادات</CardTitle></CardHeader>
                    <CardContent>
                        <LineChart data={stats.revenueOverTimeData} title="الإيرادات الشهرية" />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle>توزيع مصادر الدخل</CardTitle></CardHeader>
                    <CardContent>
                        <BarChart title="مقارنة القطاعات" data={[
                            { label: 'منتجات إنها لك', value: stats.revenueEnhaLak, color: 'hsl(var(--primary))' },
                            { label: 'بداية الرحلة', value: stats.revenueCreativeWriting, color: 'hsl(var(--secondary))' },
                        ]}/>
                        <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
                            <div className="flex justify-between mb-1">
                                <span>إيرادات الاشتراكات (MRR):</span>
                                <span className="font-bold text-foreground">{stats.mrr.toLocaleString()} ج.م</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default FinancialOverviewPage;
