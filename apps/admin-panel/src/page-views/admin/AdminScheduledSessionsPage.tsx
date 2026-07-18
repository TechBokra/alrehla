
import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, CheckCircle, Clock, XCircle, Star, Package, Gift, ShieldQuestion, Check, X, Filter, RefreshCw, ArrowRightCircle, CalendarDays } from 'lucide-react';
import { useAdminScheduledSessions } from '../../hooks/queries/admin/useAdminSchedulingQuery';
import { useAdminSupportSessionRequests } from '../../hooks/queries/admin/useAdminCommunicationQuery';
import { useInstructorMutations } from '../../hooks/mutations/useInstructorMutations';
import PageLoader from '@alrehla/ui/page-loader';
import { Input } from '@alrehla/ui/input';
import { Select } from '@alrehla/ui/native-select';
import { formatDate } from '../../utils/helpers';
import type { SessionStatus, ScheduledSession } from '../../lib/database.types';
import ErrorState from '@alrehla/ui/error-state';
import { Card, CardContent, CardHeader, CardTitle } from '@alrehla/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@alrehla/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@alrehla/ui/tabs';
import { Button } from '@alrehla/ui/button';
import IntroductorySessionSchedulerModal from '../../components/admin/IntroductorySessionSchedulerModal';
import SortableTableHead from '../../components/admin/ui/SortableTableHead';
import DatePicker from '../../components/admin/ui/DatePicker';

const getStatusInfo = (status: SessionStatus) => {
    switch (status) {
        case 'upcoming': return { text: 'قادمة', icon: <Clock size={16} className="text-blue-500" /> };
        case 'completed': return { text: 'مكتملة', icon: <CheckCircle size={16} className="text-green-500" /> };
        case 'missed': return { text: 'لم يحضر', icon: <XCircle size={16} className="text-red-500" /> };
        default: return { text: status, icon: <Clock size={16} className="text-gray-500" /> };
    }
};

type EnrichedSession = ScheduledSession & { instructor_name: string; child_name: string; type: string; package_name: string | null };

// Helper to parse reschedule requests
const parseRescheduleRequest = (rawReason: string) => {
    if (!rawReason || !rawReason.startsWith('RESCHEDULE|')) return null;
    
    try {
        const parts = rawReason.split('|');
        const sessionId = parts.find(p => p.startsWith('SID:'))?.split(':')[1];
        const newDateTimeStr = parts.find(p => p.startsWith('NEW:'))?.replace('NEW:', '');
        const userReason = parts.find(p => p.startsWith('REASON:'))?.replace('REASON:', '');

        if (!sessionId || !newDateTimeStr) return null;

        return {
            isReschedule: true,
            sessionId,
            newDateTime: newDateTimeStr, // ISO string likely
            displayReason: userReason
        };
    } catch (e) {
        return null;
    }
};

const AdminScheduledSessionsPage: React.FC = () => {
    const { data: sessions = [], isLoading: sessionsLoading, error: sessionsError, refetch: refetchSessions, isRefetching } = useAdminScheduledSessions();
    const { data: supportRequests = [], isLoading: supportLoading, error: supportError, refetch: refetchSupport } = useAdminSupportSessionRequests();
    const { approveSupportSessionRequest, rejectSupportSessionRequest, approveRescheduleRequest } = useInstructorMutations();
    
    const [isSchedulerModalOpen, setIsSchedulerModalOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState<SessionStatus | 'all'>('all');
    const [activeTab, setActiveTab] = useState<'all' | 'intro' | 'package' | 'subscription' | 'support'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'session_date', direction: 'desc' });

    // Date Filtering State - Default to next 30 days for better performance/UX
    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);
    const nextMonthStr = nextMonth.toISOString().split('T')[0];

    const [dateRange, setDateRange] = useState({ start: today, end: nextMonthStr });

    const isLoading = sessionsLoading || supportLoading;
    const error = sessionsError || supportError;

    const sortedAndFilteredSessions = useMemo(() => {
        let filtered = (sessions as any[]).filter(s => {
            // 1. Status Filter
            const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
            
            // 2. Tab (Type) Filter
            let matchesType = false;
            switch (activeTab) {
                case 'intro': matchesType = s.package_name === 'الجلسة التعريفية'; break;
                case 'package': matchesType = s.type === 'حجز باقة' && s.package_name !== 'الجلسة التعريفية'; break;
                case 'subscription': matchesType = s.type === 'اشتراك'; break;
                default: matchesType = true;
            }
            
            // 3. Search Filter
            const matchesSearch = searchTerm === '' || 
                (s.instructor_name && s.instructor_name.toLowerCase().includes(searchTerm.toLowerCase())) || 
                (s.child_name && s.child_name.toLowerCase().includes(searchTerm.toLowerCase()));

            // 4. Date Range Filter
            const sessionDate = s.session_date.split('T')[0];
            const matchesDate = (!dateRange.start || sessionDate >= dateRange.start) && 
                                (!dateRange.end || sessionDate <= dateRange.end);

            return matchesStatus && matchesType && matchesSearch && matchesDate;
        });
        
        if (sortConfig !== null) {
            filtered.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
                if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return filtered;
    }, [sessions, statusFilter, activeTab, searchTerm, sortConfig, dateRange]);
    
    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    if (isLoading) return <PageLoader text="جاري تحميل الجلسات..." />;
    if (error) return <ErrorState message={(error as Error).message} onRetry={() => { refetchSessions(); refetchSupport(); }} />;

    return (
        <>
        <IntroductorySessionSchedulerModal isOpen={isSchedulerModalOpen} onClose={() => setIsSchedulerModalOpen(false)} />
        <div className="animate-fadeIn space-y-8">
            <div className="flex justify-between items-center">
                 <h1 className="text-3xl font-extrabold text-foreground">إدارة الجلسات</h1>
                 <Button onClick={() => { refetchSessions(); refetchSupport(); }} variant="ghost" size="sm" icon={<RefreshCw className={isRefetching ? 'animate-spin' : ''} size={16}/>}>تحديث</Button>
            </div>
           
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Calendar /> جدول الجلسات</CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
                        <TabsList className="mb-6 flex-wrap h-auto">
                            <TabsTrigger value="all">الكل</TabsTrigger>
                            <TabsTrigger value="intro"><Star className="ml-2 text-yellow-500" /> الجلسات التعريفية</TabsTrigger>
                            <TabsTrigger value="package"><Package className="ml-2" /> جلسات الباقات</TabsTrigger>
                            <TabsTrigger value="subscription"><Gift className="ml-2" /> جلسات الاشتراك</TabsTrigger>
                            <TabsTrigger value="support" className="relative">
                                <ShieldQuestion className="ml-2 text-orange-500" /> 
                                طلبات الدعم
                                {(supportRequests as any[]).filter(r => r.status === 'pending').length > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                    </span>
                                )}
                            </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="support">
                             <Table>
                                <TableHeader><TableRow><TableHead>النوع</TableHead><TableHead>المدرب</TableHead><TableHead>الطالب</TableHead><TableHead>التفاصيل</TableHead><TableHead>تاريخ الطلب</TableHead><TableHead>الإجراء</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {(supportRequests as any[]).filter(r => r.status === 'pending').map(req => {
                                        const parsedReschedule = parseRescheduleRequest(req.reason);
                                        const isReschedule = !!parsedReschedule;

                                        return (
                                            <TableRow key={req.id}>
                                                <TableCell>
                                                    {isReschedule ? (
                                                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-fit">
                                                            <CalendarDays size={12} /> تغيير موعد
                                                        </span>
                                                    ) : (
                                                        <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-fit">
                                                            <ShieldQuestion size={12} /> دعم عام
                                                        </span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-semibold">{req.instructor_name}</TableCell>
                                                <TableCell className="font-semibold">{req.child_name}</TableCell>
                                                <TableCell>
                                                    {isReschedule ? (
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2 text-sm">
                                                                <span className="text-muted-foreground text-xs">المقترح:</span>
                                                                <span className="font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded dir-ltr">
                                                                    {new Date(parsedReschedule!.newDateTime).toLocaleString('ar-EG')}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground italic">"{(parsedReschedule!.displayReason || '').substring(0, 50)}..."</p>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground max-w-sm block truncate" title={req.reason}>{req.reason}</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">{formatDate(req.requested_at)}</TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        {isReschedule ? (
                                                            <Button 
                                                                variant="success" 
                                                                size="sm" 
                                                                className="h-8 text-xs"
                                                                onClick={() => approveRescheduleRequest.mutate({ 
                                                                    requestId: req.id, 
                                                                    sessionId: parsedReschedule!.sessionId, 
                                                                    newDateTime: parsedReschedule!.newDateTime 
                                                                })} 
                                                                loading={approveRescheduleRequest.isPending}
                                                                icon={<ArrowRightCircle size={14} />}
                                                            >
                                                                اعتماد ونقل
                                                            </Button>
                                                        ) : (
                                                            <Button variant="success" size="icon" onClick={() => approveSupportSessionRequest.mutate({ requestId: req.id })} title="موافقة"><Check size={18} /></Button>
                                                        )}
                                                        <Button variant="destructive" size="icon" onClick={() => rejectSupportSessionRequest.mutate({ requestId: req.id })} title="رفض"><X size={18} /></Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                            {(supportRequests as any[]).filter(r => r.status === 'pending').length === 0 && <p className="text-center py-8 text-muted-foreground">لا توجد طلبات دعم معلقة حاليًا.</p>}
                        </TabsContent>
                        
                        <TabsContent value={activeTab} className={activeTab === 'support' ? 'hidden' : ''}>
                             
                             {/* Filters Section */}
                             <div className="bg-muted/30 p-4 rounded-xl border mb-6 space-y-4">
                                <div className="flex items-center gap-2 mb-2 text-sm font-bold text-gray-700">
                                    <Filter size={16} /> تصفية متقدمة
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                                    <div className="lg:col-span-2">
                                        <DatePicker 
                                            startDate={dateRange.start} 
                                            endDate={dateRange.end} 
                                            onStartDateChange={(d) => setDateRange(p => ({...p, start: d}))} 
                                            onEndDateChange={(d) => setDateRange(p => ({...p, end: d}))}
                                        />
                                    </div>
                                    <div className="w-full">
                                         <label className="text-xs font-semibold mb-1 block">الحالة</label>
                                         <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}>
                                            <option value="all">كل الحالات</option>
                                            {(['upcoming', 'completed', 'missed'] as SessionStatus[]).map(s => <option key={s} value={s}>{getStatusInfo(s).text}</option>)}
                                        </Select>
                                    </div>
                                    <div className="w-full">
                                        <label className="text-xs font-semibold mb-1 block">بحث</label>
                                        <Input type="search" placeholder="ابحث بالمدرب أو الطالب..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                                    </div>
                                </div>
                             </div>

                            {activeTab === 'intro' && (
                                <div className="mb-4"><Button onClick={() => setIsSchedulerModalOpen(true)} icon={<Calendar />}>جدولة جلسة تعريفية</Button></div>
                            )}
                            
                            <div className="overflow-x-auto border rounded-lg">
                                <Table>
                                    <TableHeader><TableRow>
                                        <SortableTableHead<EnrichedSession> sortKey="child_name" label="الطالب" sortConfig={sortConfig} onSort={handleSort} />
                                        <SortableTableHead<EnrichedSession> sortKey="instructor_name" label="المدرب" sortConfig={sortConfig} onSort={handleSort} />
                                        <SortableTableHead<EnrichedSession> sortKey="session_date" label="التاريخ والوقت" sortConfig={sortConfig} onSort={handleSort} />
                                        <SortableTableHead<EnrichedSession> sortKey="type" label="النوع" sortConfig={sortConfig} onSort={handleSort} />
                                        <SortableTableHead<EnrichedSession> sortKey="status" label="الحالة" sortConfig={sortConfig} onSort={handleSort} />
                                    </TableRow></TableHeader>
                                    <TableBody>
                                        {sortedAndFilteredSessions.map(session => {
                                            const statusInfo = getStatusInfo(session.status);
                                            return (<TableRow key={session.id} className="hover:bg-muted/10"><TableCell className="font-semibold">{session.child_name}</TableCell><TableCell>{session.instructor_name}</TableCell><TableCell className="text-sm">{formatDate(session.session_date)} - {new Date(session.session_date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</TableCell><TableCell className="text-sm">{session.type}</TableCell><TableCell><span className="flex items-center gap-2 text-sm font-semibold">{statusInfo.icon} {statusInfo.text}</span></TableCell></TableRow>)
                                        })}
                                    </TableBody>
                                </Table>
                                {sortedAndFilteredSessions.length === 0 && <p className="text-center py-12 text-muted-foreground font-semibold">لا توجد جلسات تطابق البحث أو الفلاتر المحددة.</p>}
                            </div>
                            <div className="mt-2 text-xs text-muted-foreground text-center">
                                يتم عرض الجلسات في الفترة من {dateRange.start || 'البداية'} إلى {dateRange.end || 'النهاية'}
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
        </>
    );
};

export default AdminScheduledSessionsPage;
