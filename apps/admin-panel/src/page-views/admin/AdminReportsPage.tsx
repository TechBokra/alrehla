
import React, { useState, useMemo } from 'react';
import { BarChart, Users, Printer, FileDown, ShoppingBag, DollarSign, GraduationCap, CalendarCheck } from 'lucide-react';
import { useAdminReportDataQuery, OrderReportItem, UserReportItem, InstructorReportItem } from '../../hooks/queries/admin/useAdminReportDataQuery';
import { useAdminInstructors } from '../../hooks/queries/admin/useAdminInstructorsQuery';
import { roleNames } from '../../lib/roles';
import PageLoader from '@alrehla/ui/page-loader';
import ErrorState from '@alrehla/ui/error-state';
import { Card, CardHeader, CardTitle, CardContent } from '@alrehla/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@alrehla/ui/tabs';
import DatePicker from '../../components/admin/ui/DatePicker';
import { Select } from '@alrehla/ui/native-select';
import { Button } from '@alrehla/ui/button';
import DataTable from '../../components/admin/ui/DataTable';
import StatCard from '../../components/admin/StatCard';
import FormField from '@alrehla/ui/form-field';
import { formatCurrency } from '../../utils/helpers';

type ReportType = 'orders' | 'users' | 'instructors';

const orderStatuses = ["بانتظار الدفع", "بانتظار المراجعة", "قيد التجهيز", "يحتاج مراجعة", "تم الشحن", "تم التسليم", "مكتمل", "ملغي"];

const userRoles = Object.keys(roleNames);

const ReportsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ReportType>('orders');
    const [filters, setFilters] = useState({ startDate: '', endDate: '', status: 'all', instructorId: 'all' });
    const [reportGenerated, setReportGenerated] = useState(false);

    const { data, isLoading, error, refetch } = useAdminReportDataQuery(activeTab, filters, reportGenerated);
    const { data: instructorsList = [] } = useAdminInstructors();

    const handleGenerateReport = () => {
        setReportGenerated(true);
        refetch();
    };
    
    const handleFilterChange = (field: keyof typeof filters, value: string) => {
        setFilters(prev => ({...prev, [field]: value}));
        setReportGenerated(false); // Require re-generation
    };
    
     const handleTabChange = (tab: ReportType) => {
        setActiveTab(tab);
        setFilters({ startDate: '', endDate: '', status: 'all', instructorId: 'all' });
        setReportGenerated(false);
    };

    const reportSummary = useMemo(() => {
        if (!data) return null;
        if (activeTab === 'orders') {
            const orders = data as OrderReportItem[];
            const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
            return {
                count: orders.length,
                revenue: totalRevenue,
            };
        }
        if (activeTab === 'instructors') {
            const instructors = data as InstructorReportItem[];
            const totalSessions = instructors.reduce((sum, inst) => sum + inst.completedSessions, 0);
            const totalStudents = instructors.reduce((sum, inst) => sum + inst.totalStudents, 0);
            return { count: instructors.length, totalSessions, totalStudents };
        }
        return { count: data.length };
    }, [data, activeTab]);

    const exportToCSV = () => {
        if (!data || data.length === 0) return;
        let headers: string[] = [];
        let rows: (string | number)[][] = [];

        if (activeTab === 'orders') {
            const orders = data as OrderReportItem[];
            headers = ['ID', 'العميل', 'الطفل', 'الملخص', 'الإجمالي', 'الحالة', 'التاريخ'];
            rows = orders.map(item => [item.id, item.users?.name || '', item.child_profiles?.name || '', item.item_summary, item.total, item.status, item.order_date]);
        } else if (activeTab === 'users') {
             const users = data as UserReportItem[];
            headers = ['ID', 'الاسم', 'البريد الإلكتروني', 'الدور', 'تاريخ التسجيل'];
            rows = users.map(item => [item.id, item.name, item.email, roleNames[item.role as keyof typeof roleNames], item.created_at]);
        } else if (activeTab === 'instructors') {
            const instructors = data as InstructorReportItem[];
            headers = ['المعرف', 'الاسم', 'التخصص', 'الطلاب', 'الحجوزات', 'جلسات مكتملة', 'جلسات تعريفية'];
            rows = instructors.map(item => [item.id, item.name, item.specialty, item.totalStudents, item.totalBookings, item.completedSessions, item.introSessions]);
        }

        let csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n" 
            + rows.map(e => e.join(",")).join("\n");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${activeTab}_report.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const printReport = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            const tableHtml = document.getElementById('report-table')?.outerHTML;
            printWindow.document.write(`
                <html>
                <head>
                    <title>تقرير ${activeTab === 'orders' ? 'الطلبات' : activeTab === 'instructors' ? 'المدربين' : 'المستخدمين'}</title>
                    <style>
                        body { font-family: sans-serif; direction: rtl; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
                        th { background-color: #f2f2f2; }
                    </style>
                </head>
                <body>
                    <h1>تقرير ${activeTab === 'orders' ? 'الطلبات' : activeTab === 'instructors' ? 'المدربين' : 'المستخدمين'}</h1>
                    <p>الفترة من: ${filters.startDate || 'البداية'} إلى: ${filters.endDate || 'النهاية'}</p>
                    ${tableHtml}
                </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
        }
    };


    const renderFilters = () => {
        const statusOptions = activeTab === 'orders' ? orderStatuses : userRoles;
        const statusLabels = activeTab === 'orders' ? orderStatuses : userRoles.map(r => roleNames[r as keyof typeof roleNames]);

        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <DatePicker 
                    startDate={filters.startDate}
                    endDate={filters.endDate}
                    onStartDateChange={(date) => handleFilterChange('startDate', date)}
                    onEndDateChange={(date) => handleFilterChange('endDate', date)}
                />
                {activeTab !== 'instructors' ? (
                    <FormField label="الحالة" htmlFor="status-filter">
                         <Select id="status-filter" value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
                            <option value="all">الكل</option>
                            {statusOptions.map((status, index) => (
                                <option key={status} value={status}>{statusLabels[index]}</option>
                            ))}
                        </Select>
                    </FormField>
                ) : (
                    <FormField label="المدرب" htmlFor="instructor-filter">
                        <Select id="instructor-filter" value={filters.instructorId} onChange={(e) => handleFilterChange('instructorId', e.target.value)}>
                            <option value="all">كل المدربين</option>
                            {instructorsList.map(inst => (
                                <option key={inst.id} value={inst.id.toString()}>{inst.name}</option>
                            ))}
                        </Select>
                    </FormField>
                )}
                <Button onClick={handleGenerateReport} loading={isLoading}>
                    إنشاء التقرير
                </Button>
            </div>
        );
    };

    return (
        <div className="animate-fadeIn space-y-8">
            <h1 className="text-3xl font-extrabold text-foreground">التقارير المخصصة</h1>
            
            <Tabs value={activeTab} onValueChange={(val) => handleTabChange(val as ReportType)}>
                <TabsList>
                    <TabsTrigger value="orders"><ShoppingBag className="ml-2" /> تقرير الطلبات</TabsTrigger>
                    <TabsTrigger value="users"><Users className="ml-2" /> تقرير المستخدمين</TabsTrigger>
                    <TabsTrigger value="instructors"><GraduationCap className="ml-2" /> تقرير المدربين</TabsTrigger>
                </TabsList>

                <TabsContent value="orders">
                    <Card>
                        <CardHeader><CardTitle>فلترة تقرير الطلبات</CardTitle></CardHeader>
                        <CardContent>{renderFilters()}</CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="users">
                     <Card>
                        <CardHeader><CardTitle>فلترة تقرير المستخدمين</CardTitle></CardHeader>
                        <CardContent>{renderFilters()}</CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="instructors">
                     <Card>
                        <CardHeader><CardTitle>فلترة تقرير المدربين</CardTitle></CardHeader>
                        <CardContent>{renderFilters()}</CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
            
            {reportGenerated && (
                isLoading ? <PageLoader text="جاري إنشاء التقرير..." /> :
                error ? <ErrorState message={(error as Error).message} onRetry={refetch} /> :
                data && (
                    <Card className="animate-fadeIn">
                        <CardHeader>
                            <CardTitle className="flex justify-between items-center">
                                <span>نتائج التقرير</span>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={exportToCSV} icon={<FileDown size={16}/>}>تصدير CSV</Button>
                                    <Button variant="outline" size="sm" onClick={printReport} icon={<Printer size={16}/>}>طباعة</Button>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                               {activeTab === 'instructors' ? (
                                   <>
                                       <StatCard title="إجمالي المدربين" value={reportSummary?.count ?? 0} icon={<Users />} />
                                       <StatCard title="جلسات مكتملة" value={reportSummary?.totalSessions ?? 0} icon={<CalendarCheck className="text-green-500"/>} />
                                       <StatCard title="إجمالي الطلاب المسجلين" value={reportSummary?.totalStudents ?? 0} icon={<GraduationCap className="text-blue-500"/>} />
                                   </>
                               ) : (
                                   <>
                                       <StatCard title={`إجمالي ${activeTab === 'orders' ? 'الطلبات' : 'المستخدمين'}`} value={reportSummary?.count ?? 0} icon={activeTab === 'orders' ? <ShoppingBag /> : <Users />} />
                                       {activeTab === 'orders' && reportSummary?.revenue !== undefined && (
                                           <StatCard title="إجمالي الإيرادات" value={formatCurrency(reportSummary.revenue)} icon={<DollarSign />} />
                                       )}
                                   </>
                               )}
                            </div>
                            <div id="report-table">
                                {activeTab === 'instructors' ? (
                                    <DataTable 
                                        data={data as InstructorReportItem[]}
                                        columns={[
                                            { accessorKey: 'name', header: 'المدرب' },
                                            { accessorKey: 'totalStudents', header: 'الطلاب المسجلين' },
                                            { accessorKey: 'totalBookings', header: 'إجمالي الحجوزات' },
                                            { accessorKey: 'completedSessions', header: 'جلسات مكتملة' },
                                            { accessorKey: 'introSessions', header: 'جلسات مجانية (تعريفية)' },
                                            { accessorKey: 'upcomingSessions', header: 'جلسات محجوزة (قادمة)' },
                                        ]}
                                    />
                                ) : activeTab === 'orders' ? (
                                    <DataTable 
                                        data={data as OrderReportItem[]}
                                        columns={[
                                            { accessorKey: 'users.name', header: 'العميل', cell: ({ value }) => value || 'غير معروف' },
                                            { accessorKey: 'child_profiles.name', header: 'الطفل', cell: ({ value }) => value || 'غير معروف' },
                                            { accessorKey: 'item_summary', header: 'الملخص' },
                                            { accessorKey: 'total', header: 'الإجمالي', cell: ({value}) => formatCurrency(value) },
                                            { accessorKey: 'status', header: 'الحالة' },
                                        ]}
                                    />
                                ) : (
                                     <DataTable 
                                        data={data as UserReportItem[]}
                                        columns={[
                                            { accessorKey: 'name', header: 'الاسم' },
                                            { accessorKey: 'email', header: 'البريد الإلكتروني' },
                                            { accessorKey: 'role', header: 'الدور', cell: ({ value }) => roleNames[value as keyof typeof roleNames] || value },
                                            { accessorKey: 'created_at', header: 'تاريخ التسجيل', cell: ({value}) => new Date(value).toLocaleDateString('ar-EG') },
                                        ]}
                                    />
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )
            )}
        </div>
    );
};

export default ReportsPage;