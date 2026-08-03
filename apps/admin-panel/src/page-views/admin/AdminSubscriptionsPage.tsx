
import React, { useState, useMemo } from 'react';
import { Star, Calendar, Pause, Play, XCircle, DollarSign, Users, Archive, Activity } from 'lucide-react';
import { useAdminSubscriptions, useAdminSubscriptionPlans } from '../../hooks/queries/admin/useAdminEnhaLakQuery';
import { useSubscriptionMutations } from '../../hooks/mutations/useSubscriptionMutations';
import PageLoader from '@alrehla/ui/page-loader';
import { SessionSchedulerModal } from '../../components/admin/SessionSchedulerModal';
import { Button } from '@alrehla/ui/button';
import { Input } from '@alrehla/ui/input';
import { formatDate } from '../../utils/helpers';
import type { Subscription } from '../../lib/database.types';
import ErrorState from '@alrehla/ui/error-state';
import { Card, CardContent, CardHeader, CardTitle } from '@alrehla/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@alrehla/ui/table';
import StatCard from '../../components/admin/StatCard';
import SortableTableHead from '../../components/admin/ui/SortableTableHead';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@alrehla/ui/tabs';

const getStatusInfo = (status: Subscription['status']) => {
    switch (status) {
        case 'active': return { text: 'نشط', color: 'bg-green-100 text-green-800' };
        case 'paused': return { text: 'متوقف مؤقتاً', color: 'bg-yellow-100 text-yellow-800' };
        case 'cancelled': return { text: 'ملغي', color: 'bg-red-100 text-red-800' };
        case 'pending_payment': return { text: 'بانتظار الدفع', color: 'bg-gray-200 text-gray-800' };
        case 'pending_review': return { text: 'الإيصال قيد المراجعة', color: 'bg-blue-100 text-blue-800' };
        default: return { text: status, color: 'bg-gray-100 text-gray-800' };
    }
};

const AdminSubscriptionsPage: React.FC = () => {
    const { data: subscriptions = [], isLoading: subsLoading, error: subsError, refetch: refetchSubs } = useAdminSubscriptions();
    const { data: plans = [], isLoading: plansLoading, error: plansError, refetch: refetchPlans } = useAdminSubscriptionPlans();
    const { pauseSubscription, cancelSubscription, reactivateSubscription } = useSubscriptionMutations();

    const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
    const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof Subscription; direction: 'asc' | 'desc' } | null>({ key: 'start_date', direction: 'desc' });
    const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
    
    const isLoading = subsLoading || plansLoading;
    const error = subsError || plansError;
    const refetch = () => {
        if (subsError) refetchSubs();
        if (plansError) refetchPlans();
    };

    const subscriptionStats = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active');
        
        const mrr = activeSubscriptions.reduce((total, sub) => {
            const plan = plans.find(p => p.name === sub.plan_name);
            return total + (plan?.price_per_month || 0);
        }, 0);
    
        const newSubscriptionsThisMonth = subscriptions.filter(sub => new Date(sub.start_date) >= startOfMonth).length;
    
        return {
            activeCount: activeSubscriptions.length,
            mrr,
            newThisMonth: newSubscriptionsThisMonth
        };
    }, [subscriptions, plans]);


    const sortedAndFilteredSubscriptions = useMemo(() => {
        let filtered = [...subscriptions].filter(sub => {
            // Search Logic
            const matchesSearch = sub.user_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                sub.child_name.toLowerCase().includes(searchTerm.toLowerCase());

            // Tab Logic
            let matchesTab = false;
            if (activeTab === 'active') {
                // Show active, paused, pending payment
                matchesTab = sub.status !== 'cancelled';
            } else {
                // Show only cancelled
                matchesTab = sub.status === 'cancelled';
            }

            return matchesSearch && matchesTab;
        });

        if (sortConfig !== null) {
            filtered.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
                if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return filtered;
    }, [subscriptions, searchTerm, sortConfig, activeTab]);

    const handleOpenScheduler = (subscription: Subscription) => {
        setSelectedSubscription(subscription);
        setIsSchedulerOpen(true);
    };

    const handleSort = (key: keyof Subscription) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    if (isLoading) return <PageLoader text="جاري تحميل الاشتراكات..." />;
    if (error) return <ErrorState message={(error as Error).message} onRetry={refetch} />;

    return (
        <>
            <SessionSchedulerModal 
                isOpen={isSchedulerOpen}
                onClose={() => setIsSchedulerOpen(false)}
                subscription={selectedSubscription}
            />
            <div className="animate-fadeIn space-y-8">
                <h1 className="text-3xl font-extrabold text-foreground">إدارة الاشتراكات</h1>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard title="الاشتراكات النشطة" value={subscriptionStats.activeCount} icon={<Star className="h-4 w-4 text-muted-foreground" />} />
                    <StatCard title="الإيرادات الشهرية المتكررة" value={`${subscriptionStats.mrr} ج.م`} icon={<DollarSign className="h-4 w-4 text-muted-foreground" />} />
                    <StatCard title="اشتراكات جديدة (هذا الشهر)" value={subscriptionStats.newThisMonth} icon={<Users className="h-4 w-4 text-muted-foreground" />} />
                </div>
                
                <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="w-full">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
                        <TabsList>
                            <TabsTrigger value="active" className="gap-2">
                                <Activity size={16} /> الاشتراكات الحالية
                            </TabsTrigger>
                            <TabsTrigger value="archived" className="gap-2">
                                <Archive size={16} /> الأرشيف (الملغاة)
                            </TabsTrigger>
                        </TabsList>

                        <div className="w-full md:w-72">
                            <Input 
                                type="search"
                                placeholder="ابحث باسم ولي الأمر أو الطفل..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <Card>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                <TableHeader>
                                    <TableRow>
                                            <SortableTableHead<Subscription> sortKey="user_name" label="ولي الأمر" sortConfig={sortConfig} onSort={handleSort} />
                                            <SortableTableHead<Subscription> sortKey="child_name" label="الطفل" sortConfig={sortConfig} onSort={handleSort} />
                                            <SortableTableHead<Subscription> sortKey="plan_name" label="الباقة" sortConfig={sortConfig} onSort={handleSort} />
                                            <SortableTableHead<Subscription> sortKey="next_renewal_date" label="التجديد القادم" sortConfig={sortConfig} onSort={handleSort} />
                                            <SortableTableHead<Subscription> sortKey="status" label="الحالة" sortConfig={sortConfig} onSort={handleSort} />
                                            <TableHead>إجراءات</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sortedAndFilteredSubscriptions.length > 0 ? (
                                            sortedAndFilteredSubscriptions.map(sub => {
                                                const statusInfo = getStatusInfo(sub.status);
                                                return (
                                                    <TableRow key={sub.id}>
                                                        <TableCell className="font-semibold">{sub.user_name}</TableCell>
                                                        <TableCell className="font-semibold">{sub.child_name}</TableCell>
                                                        <TableCell className="font-semibold text-primary">{sub.plan_name}</TableCell>
                                                        <TableCell className="text-sm">{formatDate(sub.next_renewal_date)}</TableCell>
                                                        <TableCell>
                                                            <span className={`px-2 py-1 text-xs font-bold rounded-full ${statusInfo.color}`}>{statusInfo.text}</span>
                                                        </TableCell>
                                                        <TableCell className="flex items-center gap-1 flex-wrap">
                                                            {sub.status !== 'cancelled' && (
                                                                <Button variant="outline" size="sm" icon={<Calendar size={14}/>} onClick={() => handleOpenScheduler(sub)}>
                                                                    جدولة
                                                                </Button>
                                                            )}
                                                            {sub.status === 'active' && 
                                                                <Button variant="ghost" size="sm" icon={<Pause size={14}/>} onClick={() => pauseSubscription.mutate({ subscriptionId: sub.id })}>
                                                                    إيقاف
                                                                </Button>
                                                            }
                                                            {sub.status === 'paused' && 
                                                                <Button variant="ghost" size="sm" icon={<Play size={14}/>} onClick={() => reactivateSubscription.mutate({ subscriptionId: sub.id })}>
                                                                    إعادة تفعيل
                                                                </Button>
                                                            }
                                                            {sub.status === 'pending_review' &&
                                                                <Button variant="success" size="sm" icon={<Play size={14}/>} onClick={() => reactivateSubscription.mutate({ subscriptionId: sub.id })}>
                                                                    اعتماد وتفعيل
                                                                </Button>
                                                            }
                                                            {sub.status !== 'cancelled' &&
                                                                <Button variant="ghost" size="sm" icon={<XCircle size={14}/>} className="text-destructive" onClick={() => cancelSubscription.mutate({ subscriptionId: sub.id })}>
                                                                    إلغاء
                                                                </Button>
                                                            }
                                                            {sub.status === 'cancelled' && <span className="text-muted-foreground text-xs italic">لا توجد إجراءات</span>}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                    لا توجد اشتراكات في هذه القائمة.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </Tabs>
            </div>
        </>
    );
};

export default AdminSubscriptionsPage;
