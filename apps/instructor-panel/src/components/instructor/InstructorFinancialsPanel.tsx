import React, { useMemo } from 'react';
import { DollarSign, Landmark, TrendingUp, ArrowUpRight, Wallet, History } from 'lucide-react';
import InstructorSection from './InstructorSection';
import { Button } from '@alrehla/ui/button';
import type { Instructor, CreativeWritingBooking, ServiceOrder, InstructorPayout } from '../../lib/database.types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@alrehla/ui/table';
import { formatDate } from '../../utils/helpers';
import { Card, CardHeader, CardTitle, CardContent } from '@alrehla/ui/card';

interface InstructorFinancialsPanelProps {
    bookings: CreativeWritingBooking[];
    serviceOrders: ServiceOrder[];
    payouts: InstructorPayout[];
    instructor: Instructor;
}

const InstructorFinancialsPanel: React.FC<InstructorFinancialsPanelProps> = ({ bookings, serviceOrders, payouts, instructor }) => {
    
    const financialSummary = useMemo(() => {
        const bookingEarnings = (bookings || [])
            .filter(b => b.status === 'مكتمل')
            .map(b => {
                const netAmount = instructor.package_rates?.[b.package_name] || (instructor.rate_per_session || 0 * 1);
                return { 
                    ...b, 
                    netAmount, 
                    type: 'جلسة/باقة',
                    date: b.booking_date
                };
            });

        const serviceEarnings = (serviceOrders || [])
            .filter(o => o.status === 'مكتمل')
            .map(o => {
                const netAmount = instructor.service_rates?.[o.service_id] || (o.total * 0.7);
                return { 
                    ...o, 
                    netAmount, 
                    type: 'خدمة',
                    date: o.created_at,
                    package_name: (o as any).service_name || 'خدمة'
                };
            });

        const totalEarned = [...bookingEarnings, ...serviceEarnings].reduce((sum, item) => sum + item.netAmount, 0);
        const totalPaid = (payouts || []).reduce((sum, p) => sum + p.amount, 0);
        const outstanding = totalEarned - totalPaid;

        return {
            totalEarned,
            totalPaid,
            outstanding,
            recentItems: [...bookingEarnings, ...serviceEarnings]
                .sort((a, b) => new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime())
                .slice(0, 10)
        };
    }, [bookings, serviceOrders, payouts, instructor]);

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Financial Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border shadow-sm relative overflow-hidden bg-gradient-to-br from-green-50 to-white">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-green-100 rounded-bl-full -mr-4 -mt-4 opacity-50"></div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <Wallet className="w-4 h-4 text-green-600" />
                            الرصيد المستحق (للسحب)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-gray-900">{financialSummary.outstanding.toLocaleString()}</span>
                            <span className="text-sm font-semibold text-muted-foreground">ج.م</span>
                        </div>
                        {financialSummary.outstanding > 0 ? (
                            <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-green-700 bg-green-100/50 w-fit px-2 py-1 rounded">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                جاهز للتحويل في الدورة القادمة
                            </div>
                        ) : (
                            <p className="mt-3 text-xs text-muted-foreground">لا توجد مستحقات معلقة.</p>
                        )}
                    </CardContent>
                </Card>

                <Card className="border shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-blue-600" />
                            إجمالي الأرباح (تاريخياً)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-gray-900">{financialSummary.totalEarned.toLocaleString()}</span>
                            <span className="text-sm font-semibold text-muted-foreground">ج.م</span>
                        </div>
                        <div className="mt-3 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-blue-500 h-full rounded-full" style={{width: '100%'}}></div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <ArrowUpRight className="w-4 h-4 text-gray-600" />
                            تم تحويله
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                         <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-gray-900">{financialSummary.totalPaid.toLocaleString()}</span>
                            <span className="text-sm font-semibold text-muted-foreground">ج.م</span>
                        </div>
                        <p className="mt-3 text-xs text-muted-foreground flex items-center gap-1">
                            <History size={12}/>
                            آخر تحديث: {new Date().toLocaleDateString('ar-EG')}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <InstructorSection title="آخر المعاملات (الأرباح المضافة)" icon={<DollarSign />}>
                         {financialSummary.recentItems.length > 0 ? (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/30">
                                            <TableHead>النشاط</TableHead>
                                            <TableHead>النوع</TableHead>
                                            <TableHead>التاريخ</TableHead>
                                            <TableHead className="text-left">صافي الربح</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {financialSummary.recentItems.map((item, idx) => (
                                            <TableRow key={idx} className="hover:bg-muted/5">
                                                <TableCell>
                                                    <p className="font-bold text-sm text-gray-800">{item.package_name || (item as any).details?.serviceName}</p>
                                                    <p className="text-[10px] text-muted-foreground">{(item as any).child_profiles?.name}</p>
                                                </TableCell>
                                                <TableCell>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${item.type === 'خدمة' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-purple-50 text-purple-700 border-purple-100'}`}>
                                                        {item.type}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-xs text-gray-500 font-mono">{formatDate(item.date)}</TableCell>
                                                <TableCell className="text-left">
                                                    <span className="font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md border border-green-100">
                                                        +{item.netAmount} ج.م
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                         ) : (
                              <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                                  <p>لا توجد معاملات مالية حديثة.</p>
                              </div>
                         )}
                    </InstructorSection>
                </div>

                <div className="lg:col-span-1">
                    <Card className="bg-blue-50 border-blue-200 shadow-sm h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-blue-900"><Landmark size={20} /> سياسة الدفع</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm text-blue-800">
                            <div className="bg-white/60 p-3 rounded-lg flex gap-3 items-start">
                                <span className="font-bold bg-blue-200 text-blue-800 w-6 h-6 flex items-center justify-center rounded-full text-xs shrink-0">1</span>
                                <p>يتم احتساب الأرباح فقط للجلسات والخدمات التي تم إكمالها وإغلاقها بنجاح.</p>
                            </div>
                            <div className="bg-white/60 p-3 rounded-lg flex gap-3 items-start">
                                <span className="font-bold bg-blue-200 text-blue-800 w-6 h-6 flex items-center justify-center rounded-full text-xs shrink-0">2</span>
                                <p>دورة التحويل شهرية. تتم مراجعة الحسابات في نهاية الشهر، والتحويل في الأسبوع الأول من الشهر التالي.</p>
                            </div>
                            <div className="bg-white/60 p-3 rounded-lg flex gap-3 items-start">
                                <span className="font-bold bg-blue-200 text-blue-800 w-6 h-6 flex items-center justify-center rounded-full text-xs shrink-0">3</span>
                                <p>تأكد من مراجعة حساباتك وتحديث بيانات الدفع مع الإدارة لضمان وصول الدفعات في موعدها.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default InstructorFinancialsPanel;
