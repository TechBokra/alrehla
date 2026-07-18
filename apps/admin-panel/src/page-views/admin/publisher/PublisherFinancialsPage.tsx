
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { reportingService } from '../../../services/reportingService';
import PageLoader from '@alrehla/ui/page-loader';
import { Card, CardHeader, CardTitle, CardContent } from '@alrehla/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@alrehla/ui/table';
import { DollarSign, Wallet, ArrowUpRight, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { formatDate, formatCurrency } from '../../../utils/helpers';
import StatCard from '../../../components/admin/StatCard';

const PublisherFinancialsPage: React.FC = () => {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (currentUser?.id) {
                const result = await reportingService.getPublisherFinancials(currentUser.id);
                setData(result);
                setLoading(false);
            }
        };
        fetchData();
    }, [currentUser]);

    if (loading) return <PageLoader text="جاري احتساب البيانات المالية..." />;

    if (!data) return (
        <div className="p-8 text-center text-gray-500 border-2 border-dashed rounded-xl mt-8">
            <AlertCircle className="mx-auto mb-2 h-12 w-12 opacity-20" />
            <p>لا توجد بيانات مالية متاحة بعد. أضف كتباً وابدأ البيع!</p>
        </div>
    );

    return (
        <div className="animate-fadeIn space-y-8">
            <h1 className="text-3xl font-extrabold text-foreground">الماليات والأرباح</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <Card className="bg-primary/5 border-primary/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Wallet className="w-4 h-4 text-primary" /> الرصيد المستحق (للسحب)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-primary">{formatCurrency(data.outstandingBalance)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {data.outstandingBalance > 0 ? 'جاهز للتحويل في الدورة القادمة' : 'لا توجد مستحقات معلقة'}
                        </p>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-green-600" /> إجمالي الأرباح
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-700">{formatCurrency(data.totalEarnings)}</div>
                        <p className="text-xs text-muted-foreground mt-1">تراكمي منذ البداية</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <ArrowUpRight className="w-4 h-4 text-blue-600" /> تم تحويله
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-700">{formatCurrency(data.totalPaid)}</div>
                        <p className="text-xs text-muted-foreground mt-1">إجمالي الدفعات المستلمة</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar size={20} className="text-gray-500" /> سجل المعاملات
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {data.transactions.length > 0 ? (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead>التاريخ</TableHead>
                                        <TableHead>النوع</TableHead>
                                        <TableHead>الوصف</TableHead>
                                        <TableHead className="text-left">المبلغ</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.transactions.map((t: any) => (
                                        <TableRow key={t.id} className="hover:bg-muted/10">
                                            <TableCell className="font-mono text-sm text-muted-foreground">
                                                {formatDate(t.date)}
                                            </TableCell>
                                            <TableCell>
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                    t.type === 'earning' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                    {t.type === 'earning' ? 'إيراد بيع' : 'دفعة مستلمة'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">{t.description}</div>
                                                {t.customerPrice && (
                                                    <div className="text-[10px] text-muted-foreground">
                                                        سعر البيع: {formatCurrency(t.customerPrice)}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className={`text-left font-bold font-mono ${t.type === 'earning' ? 'text-green-600' : 'text-red-600'}`}>
                                                {t.type === 'earning' ? '+' : '-'}{formatCurrency(t.amount)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <p className="text-center py-12 text-muted-foreground">لا توجد معاملات مسجلة حتى الآن.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default PublisherFinancialsPage;
