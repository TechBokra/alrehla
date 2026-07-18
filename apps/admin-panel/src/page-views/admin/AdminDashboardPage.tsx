
import React, { useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useAdminDashboardData } from '../../hooks/queries/admin/useAdminDashboardDataQuery';
import { DashboardSkeleton } from '@alrehla/ui/skeletons';
import ErrorState from '@alrehla/ui/error-state';

// Import all the widgets
import StatsSummaryWidget from '../../components/admin/dashboards/StatsSummaryWidget';
import ActionCenterWidget from '../../components/admin/dashboards/ActionCenterWidget';
import RecentActivityWidget from '../../components/admin/dashboards/RecentActivityWidget';
import QuickActionsWidget from '../../components/admin/dashboards/QuickActionsWidget';
import ContentSummaryWidget from '../../components/admin/dashboards/ContentSummaryWidget';
import AgendaWidget from '../../components/admin/dashboards/AgendaWidget';

const AdminDashboardPage: React.FC = () => {
    const { currentUser, permissions } = useAuth();
    const { data, isLoading, error, refetch } = useAdminDashboardData();

    const enrichedBookings = useMemo(() => {
        if (!data?.bookings || !data?.scheduledSessions) return [];
        
        const sessionsByBookingId = new Map();
        data.scheduledSessions.forEach((session: any) => {
            if (!sessionsByBookingId.has(session.booking_id)) {
                sessionsByBookingId.set(session.booking_id, []);
            }
            sessionsByBookingId.get(session.booking_id).push(session);
        });

        return data.bookings.map((booking: any) => ({
            ...booking,
            sessions: sessionsByBookingId.get(booking.id) || []
        }));
    }, [data]);

    if (isLoading) {
        return <DashboardSkeleton />;
    }

    if (error || !data) {
        return <ErrorState message={(error as Error)?.message || 'Failed to load dashboard data'} onRetry={refetch} />;
    }

    const hasAnyActions = data.orders.some((o: any) => o.status === 'بانتظار المراجعة') ||
        data.serviceOrders.some((o: any) => o.status === 'بانتظار المراجعة') ||
        data.bookings.some((b: any) => b.status === 'بانتظار الدفع') ||
        data.instructors.some((i: any) => i.schedule_status === 'pending' || i.profile_update_status === 'pending') || // Added profile_update_status check
        data.supportTickets.some((t: any) => t.status === 'جديدة') ||
        data.joinRequests.some((r: any) => r.status === 'جديد');
    
    // Determine which widgets to show based on permissions
    const showGlobalStats = permissions.canViewGlobalStats;
    const showActionCenter = hasAnyActions && (
        permissions.canManageEnhaLakOrders || 
        permissions.canManageCreativeWritingBookings ||
        permissions.canManageInstructorUpdates ||
        permissions.canManageSupportTickets ||
        permissions.canManageJoinRequests
    );
    const showRecentActivity = permissions.canViewGlobalStats;
    const showQuickActions = permissions.canManageEnhaLakProducts || permissions.canManageBlog || permissions.canManageUsers;
    const showContentSummary = permissions.canManageBlog || permissions.canViewContentStats;


    return (
        <div className="animate-fadeIn space-y-8">
            <h1 className="text-3xl font-extrabold text-foreground">مرحباً، {currentUser?.name}</h1>
            
            {showGlobalStats && <StatsSummaryWidget data={data} />}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
                {/* Main column for primary actions and activities */}
                <div className="xl:col-span-2 space-y-8">
                    {showActionCenter && <ActionCenterWidget data={data} permissions={permissions} />}
                    
                    <AgendaWidget bookings={enrichedBookings} attachments={data.attachments || []} />

                    {!showActionCenter && (
                         <div className="bg-white p-8 rounded-lg shadow-sm text-center min-h-[300px] flex flex-col justify-center items-center">
                            <h2 className="text-xl font-bold">كل شيء على ما يرام!</h2>
                            <p className="text-muted-foreground mt-2">لا توجد مهام عاجلة أو أنشطة حديثة لعرضها في الوقت الحالي.</p>
                        </div>
                    )}
                </div>

                {/* Sidebar column for secondary actions and summaries */}
                <div className="xl:col-span-1 space-y-8">
                    {showQuickActions && <QuickActionsWidget permissions={permissions} />}
                    {showContentSummary && <ContentSummaryWidget blogPosts={data.blogPosts} />}
                    {showRecentActivity && <RecentActivityWidget data={data} />}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardPage;
