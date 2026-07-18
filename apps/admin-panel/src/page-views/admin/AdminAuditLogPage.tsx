
import React, { useState, useEffect } from 'react';
import { History, User, ShoppingBag, Edit, Search, Filter, List, RefreshCw, AlertCircle } from 'lucide-react';
import { useAdminAuditLogQuery } from '../../hooks/queries/admin/useAdminAuditLogQuery';
import PageLoader from '@alrehla/ui/page-loader';
import ErrorState from '@alrehla/ui/error-state';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@alrehla/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@alrehla/ui/table';
import DatePicker from '../../components/admin/ui/DatePicker';
import { Select } from '@alrehla/ui/native-select';
import { Button } from '@alrehla/ui/button';
import { useAdminUsers } from '../../hooks/queries/admin/useAdminUsersQuery';

const ActionIcon: React.FC<{ action: string }> = ({ action }) => {
    if (!action) return <History size={16} className="text-gray-400" />;
    const act = action.toUpperCase();
    if (act.includes('USER')) return <User size={16} className="text-blue-500" />;
    if (act.includes('ORDER')) return <ShoppingBag size={16} className="text-pink-500" />;
    if (act.includes('POST') || act.includes('BLOG')) return <Edit size={16} className="text-green-500" />;
    if (act.includes('INSTRUCTOR')) return <User size={16} className="text-orange-500" />;
    return <History size={16} className="text-gray-500" />;
};

const AdminAuditLogPage: React.FC = () => {
    const [filters, setFilters] = useState({ startDate: '', endDate: '', actionType: 'all', userId: 'all' });
    const [isSearchTriggered, setIsSearchTriggered] = useState(true);

    // Fix: Provide arguments and extract users correctly
    const { data: usersData } = useAdminUsers({ page: 1, pageSize: 1000, search: '', roleFilter: 'all' });
    const usersList = usersData?.users || [];

    const { data: logData, isLoading, error, refetch, isRefetching } = useAdminAuditLogQuery(filters, isSearchTriggered);

    const logs = logData?.logs || [];
    const actionTypes = logData?.actionTypes || [];

    const handleFilterChange = (field: keyof typeof filters, value: string) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const handleSearch = () => {
        setIsSearchTriggered(true);
        refetch();
    };

    const staffUsers = Array.isArray(usersList) ? usersList.filter(u => u.role !== 'user' && u.role !== 'student') : [];

    return (
        <div className="animate-fadeIn space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-extrabold text-foreground">سجل النشاطات</h1>
                    <p className="text-muted-foreground mt-1">تتبع كافة الإجراءات الإدارية وتعديلات البيانات.</p>
                </div>
                <Button onClick={() => refetch()} variant="outline" size="sm" icon={<RefreshCw className={isRefetching ? 'animate-spin' : ''} />}>
                    تحديث السجل
                </Button>
            </div>

            <Card className="border-t-4 border-t-primary">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg"><Filter size={20}/> تصفية النتائج</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                        <div className="lg:col-span-2">
                             <DatePicker 
                                startDate={filters.startDate}
                                endDate={filters.endDate}
                                onStartDateChange={(date) => handleFilterChange('startDate', date)}
                                onEndDateChange={(date) => handleFilterChange('endDate', date)}
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-sm font-medium">نوع الإجراء</label>
                            <Select value={filters.actionType} onChange={(e) => handleFilterChange('actionType', e.target.value)}>
                                <option value="all">كل الإجراءات</option>
                                {actionTypes.map((action: string) => <option key={action} value={action}>{action}</option>)}
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">المسؤول</label>
                            <Select value={filters.userId} onChange={(e) => handleFilterChange('userId', e.target.value)}>
                                <option value="all">الكل</option>
                                {staffUsers.map((user: any) => <option key={user.id} value={user.id}>{user.name}</option>)}
                            </Select>
                        </div>
                    </div>
                    
                    <div className="mt-6 flex justify-end border-t pt-4">
                        <Button onClick={handleSearch} icon={<Search size={18} />} loading={isLoading && isSearchTriggered}>
                            تطبيق الفلاتر
                        </Button>
                    </div>
                </CardContent>
            </Card>
            
            {error ? (
                <div className="p-8 text-center bg-red-50 rounded-xl border border-red-100">
                    <AlertCircle className="mx-auto text-red-500 mb-4" size={40} />
                    <h3 className="text-lg font-bold text-red-800">تعذر تحميل السجلات</h3>
                    <p className="text-sm text-red-600 mt-1">تأكد من وجود جدول audit_logs في قاعدة البيانات.</p>
                    <Button onClick={() => refetch()} variant="outline" className="mt-4 border-red-200 text-red-700">إعادة المحاولة</Button>
                </div>
            ) : (
                isLoading ? <PageLoader text="جاري تحميل سجل النشاطات..." /> : (
                    <Card className="animate-fadeIn">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/30">
                                            <TableHead className="w-[180px]">الإجراء</TableHead>
                                            <TableHead>المسؤول</TableHead>
                                            <TableHead>الهدف</TableHead>
                                            <TableHead>التفاصيل</TableHead>
                                            <TableHead className="text-left">التوقيت</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {logs.length > 0 ? logs.map((log: any) => (
                                            <TableRow key={log.id}>
                                                <TableCell><span className="flex items-center gap-2 font-mono text-[10px] font-bold bg-gray-100 p-1 rounded border border-gray-200 w-fit"><ActionIcon action={log.action} /> {log.action}</span></TableCell>
                                                <TableCell className="font-bold text-sm">{log.user_name}</TableCell>
                                                <TableCell className="text-xs text-muted-foreground">{log.target_description}</TableCell>
                                                <TableCell className="text-xs max-w-xs truncate" title={log.details}>{log.details}</TableCell>
                                                <TableCell className="text-[10px] text-muted-foreground text-left" dir="ltr">{new Date(log.timestamp).toLocaleString('ar-EG')}</TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground italic">
                                                    لا توجد سجلات بعد. بمجرد قيامك بأي عملية تعديل أو حذف، ستظهر هنا.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                )
            )}
        </div>
    );
};

export default AdminAuditLogPage;
