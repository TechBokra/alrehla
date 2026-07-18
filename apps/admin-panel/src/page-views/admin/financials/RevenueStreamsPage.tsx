
import React, { useMemo } from 'react';
import { useRevenueStreams } from '../../../hooks/queries/admin/useFinancialsQueries';
import { useAdminPricingSettings } from '../../../hooks/queries/admin/useAdminSettingsQuery';
import PageLoader from '@alrehla/ui/page-loader';
import ErrorState from '@alrehla/ui/error-state';
import { ShoppingBag, BookOpen, Wallet, TrendingUp, Landmark, PieChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@alrehla/ui/card';
import BarChart from '../../../components/admin/BarChart';
import { calculateInstructorNet, calculatePlatformMargin, calculateProductMargin, calculateProductCost } from '../../../utils/pricingCalculator';

const RevenueStreamsPage: React.FC = () => {
    const { data, isLoading, error, refetch } = useRevenueStreams();
    const { data: pricingConfig } = useAdminPricingSettings();

    const stats = useMemo(() => {
        if (!data || !pricingConfig) return null;
        
        const { orders, bookings, serviceOrders } = data;

        // --- أولاً: قطاع "إنها لك" (المنتجات) ---
        // القاعدة: هامش ربح المنصة 20%
        const enhaLakGross = orders
            .filter(o => o.status === 'مكتمل' || o.status === 'تم التسليم')
            .reduce((sum, o) => sum + (o.total || 0), 0);
        
        const enhaLakProfit = calculateProductMargin(enhaLakGross);
        const enhaLakCosts = calculateProductCost(enhaLakGross); // تكاليف التشغيل والطباعة

        // --- ثانياً: قطاع "بداية الرحلة" (المدربين والخدمات) ---
        // القاعدة: حسب معادلة التسعير (النسبة + الرسوم الثابتة)
        const cwTransactions = [...bookings, ...serviceOrders]
            .filter(o => o.status === 'مكتمل');
            
        const cwGross = cwTransactions.reduce((sum, t) => sum + (t.total || 0), 0);

        // حساب مستحقات المدربين لكل عملية
        const cwInstructorShare = cwTransactions.reduce((sum, t) => {
            return sum + calculateInstructorNet(t.total, pricingConfig);
        }, 0);

        // ربح المنصة هو الفرق بين الإجمالي وحصة المدرب
        const cwProfit = calculatePlatformMargin(cwGross, cwInstructorShare);


        // --- التجميع النهائي ---
        const totalGross = enhaLakGross + cwGross;
        const totalNetProfit = enhaLakProfit + cwProfit;
        const totalExpenses = enhaLakCosts + cwInstructorShare; // التكاليف = تكلفة المنتجات + مستحقات المدربين

        return {
            totalGross,
            totalNetProfit,
            totalExpenses,
            
            // تفاصيل القطاعات
            enhaLak: { gross: enhaLakGross, profit: enhaLakProfit, costs: enhaLakCosts },
            cw: { gross: cwGross, profit: cwProfit, instructorShare: cwInstructorShare }
        };
    }, [data, pricingConfig]);

    if (isLoading) return <PageLoader />;
    if (error) return <ErrorState message={(error as Error).message} onRetry={refetch} />;
    if (!stats) return null;

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* 1. البطاقات الرئيسية */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <Card className="bg-primary text-primary-foreground border-none shadow-lg">
                    <CardHeader className="pb-2 text-xs font-bold uppercase opacity-80">إجمالي الإيرادات (Gross Revenue)</CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black">{stats.totalGross.toLocaleString()} ج.م</div>
                        <p className="text-xs mt-2 opacity-70">إجمالي المبالغ المدفوعة من العملاء</p>
                    </CardContent>
                </Card>
                
                <Card className="bg-white border-green-500 border-t-4 shadow-sm">
                    <CardHeader className="pb-2 text-xs font-bold uppercase text-green-700">صافي ربح المنصة (Net Profit)</CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-green-600">{stats.totalNetProfit.toLocaleString()} ج.م</div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-pink-500"></span> منتجات: {stats.enhaLak.profit.toLocaleString()}</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> تدريب: {stats.cw.profit.toLocaleString()}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-red-500 border-t-4 shadow-sm">
                    <CardHeader className="pb-2 text-xs font-bold uppercase text-red-700">التكاليف والمستحقات (Expenses)</CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-red-600">{stats.totalExpenses.toLocaleString()} ج.م</div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                             <span className="flex items-center gap-1" title="مستحقات المدربين"><span className="w-2 h-2 rounded-full bg-orange-500"></span> مدربين: {stats.cw.instructorShare.toLocaleString()}</span>
                             <span className="flex items-center gap-1" title="تكلفة طباعة وتشغيل المنتجات"><span className="w-2 h-2 rounded-full bg-gray-500"></span> تشغيل: {stats.enhaLak.costs.toLocaleString()}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 2. التفاصيل والتحليل */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* تحليل قطاع المنتجات */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-pink-700">
                            <ShoppingBag className="h-5 w-5" /> تحليل "إنها لك" (المنتجات)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <BarChart title="توزيع دخل المنتجات" data={[
                                { label: 'تكلفة التشغيل (80%)', value: stats.enhaLak.costs, color: '#9ca3af' },
                                { label: 'ربح المنصة (20%)', value: stats.enhaLak.profit, color: '#ec4899' },
                            ]} />
                            <div className="p-3 bg-pink-50 rounded-lg text-pink-800 text-xs flex gap-2 items-start">
                                <Landmark className="shrink-0 mt-0.5" size={16} />
                                <p>يتم احتساب ربح ثابت للمنصة بنسبة 20% من سعر بيع أي منتج (قصص، صناديق)، وتعتبر الـ 80% المتبقية تكاليف تشغيلية.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* تحليل قطاع التدريب */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-blue-700">
                            <BookOpen className="h-5 w-5" /> تحليل "بداية الرحلة" (التدريب)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                         <div className="space-y-6">
                             <div className="flex h-40 items-end gap-4 px-4">
                                <div className="flex-1 flex flex-col items-center gap-2 group">
                                    <div className="w-full bg-orange-500 rounded-t-md relative transition-all hover:opacity-90" style={{ height: `${(stats.cw.instructorShare / stats.cw.gross) * 100}%` }}>
                                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold">{Math.floor((stats.cw.instructorShare / stats.cw.gross) * 100)}%</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground font-bold">للمدربين</span>
                                </div>
                                <div className="flex-1 flex flex-col items-center gap-2 group">
                                    <div className="w-full bg-blue-600 rounded-t-md relative transition-all hover:opacity-90" style={{ height: `${(stats.cw.profit / stats.cw.gross) * 100}%` }}>
                                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold">{Math.floor((stats.cw.profit / stats.cw.gross) * 100)}%</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground font-bold">للمنصة</span>
                                </div>
                             </div>

                            <div className="p-3 bg-blue-50 rounded-lg text-blue-800 text-xs flex gap-2 items-start">
                                <Wallet className="shrink-0 mt-0.5" size={16} />
                                <p>
                                    تعتمد الأرباح هنا على معادلة التسعير الديناميكية: <br/>
                                    <strong>(صافي المدرب × {pricingConfig?.company_percentage}) + {pricingConfig?.fixed_fee} ج.م</strong>
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            {/* مؤشر الأداء العام */}
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp /> كفاءة الأرباح الكلية</CardTitle></CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between mb-2 text-sm font-bold">
                        <span>هامش الربح الصافي (Profit Margin)</span>
                        <span className="text-green-600">{((stats.totalNetProfit / stats.totalGross) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
                        <div 
                            className="bg-green-500 h-full rounded-full transition-all duration-1000 ease-out relative" 
                            style={{ width: `${(stats.totalNetProfit / stats.totalGross) * 100}%` }}
                        >
                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 text-left">
                        تمثل هذه النسبة صافي دخل المنصة من كل جنيه يدفعها العملاء بعد خصم كافة التكاليف ومستحقات المدربين.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default RevenueStreamsPage;
