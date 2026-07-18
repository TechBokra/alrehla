
import React from 'react';
import Link from 'next/link';
import { ShieldQuestion, ShoppingBag, BookOpen, CalendarCheck, MessageSquare, UserPlus, ArrowLeft, FileEdit, Clock, CheckCircle } from 'lucide-react';
import AdminSection from '../AdminSection';
import { Button } from '@alrehla/ui/button';
import { formatDate } from '../../../utils/helpers';

const ActionItem: React.FC<{ title: string; subtitle?: string; border?: string; href: string; }> = ({ title, subtitle, border, href }) => (
    <div className={`flex items-center justify-between p-3 bg-background hover:bg-muted/50 rounded-lg border-l-4 ${border || 'border-l-primary/30'} border-t border-b border-r shadow-sm transition-all`}>
        <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm truncate">{title}</p>
            {subtitle && <p className="text-[10px] text-muted-foreground">{subtitle}</p>}
        </div>
        <Button as={Link} href={href} variant="ghost" size="sm" className="ml-2 flex-shrink-0">
            <span className="hidden sm:inline">عرض</span>
            <ArrowLeft size={14} className="sm:mr-1 transform rotate-180" />
        </Button>
    </div>
);

const ActionCenterWidget = React.forwardRef<HTMLElement, { data: any; permissions: any } & React.HTMLAttributes<HTMLElement>>(
    ({ data, permissions, ...props }, ref) => {
    
    const actionGroups = [
        {
            title: 'طلبات "إنها لك" للمراجعة',
            items: data.orders?.filter((o: any) => o.status === 'بانتظار المراجعة') || [],
            render: (item: any) => `طلب #${item.id.substring(0,6)} لـ ${item.child_profiles?.name || 'طفل'}`,
            permission: permissions.canManageEnhaLakOrders,
            to: '/orders',
            icon: <ShoppingBag className="text-pink-500" />,
            border: 'border-l-pink-500'
        },
        {
            title: 'رسائل دعم جديدة',
            items: data.supportTickets?.filter((t: any) => t.status === 'جديدة') || [],
            render: (item: any) => `رسالة من ${item.name}`,
            permission: permissions.canManageSupportTickets,
            to: '/support',
            icon: <MessageSquare className="text-cyan-500" />,
            border: 'border-l-cyan-500'
        },
        {
            title: 'طلبات انضمام جديدة',
            items: data.joinRequests?.filter((r: any) => r.status === 'جديد') || [],
            render: (item: any) => `طلب من ${item.name} (${item.role})`,
            permission: permissions.canManageJoinRequests,
            to: '/join-requests',
            icon: <UserPlus className="text-blue-500" />,
            border: 'border-l-blue-500'
        },
        {
            title: 'تحديثات المدربين',
            items: data.instructors?.filter((i: any) => i.profile_update_status === 'pending' || i.schedule_status === 'pending') || [],
            render: (item: any) => `تحديث ملف: ${item.name}`,
            permission: permissions.canManageInstructorUpdates,
            to: '/instructors',
            icon: <FileEdit className="text-orange-500" />,
            border: 'border-l-orange-500'
        },
        {
            title: 'حجوزات باقات بانتظار الدفع',
            items: data.bookings?.filter((b: any) => b.status === 'بانتظار الدفع') || [],
            render: (item: any) => `حجز ${item.package_name} لـ ${item.child_profiles?.name}`,
            permission: permissions.canManageCreativeWritingBookings,
            to: '/creative-writing',
            href: '/creative-writing?status=payment-pending',
            icon: <CalendarCheck className="text-purple-500" />,
            border: 'border-l-purple-500'
        }
    ].filter(group => group.permission && group.items.length > 0);

    const totalActions = actionGroups.reduce((acc, group) => acc + group.items.length, 0);

    return (
        <AdminSection ref={ref} title="مركز المهام العاجلة" icon={<ShieldQuestion className="text-destructive"/>} {...props}>
            {totalActions > 0 ? (
                <div className="space-y-6">
                    {actionGroups.map(group => (
                        <div key={group.title}>
                            <h3 className="font-bold text-sm mb-3 flex items-center gap-2 text-gray-700">
                                {group.icon}
                                {group.title}
                                <span className="text-[10px] bg-muted text-muted-foreground font-bold px-2 py-0.5 rounded-full border">{group.items.length}</span>
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {group.items.slice(0, 4).map((item: any) => (
                                    <ActionItem 
                                        key={item.id}
                                        title={group.render(item)}
                                        subtitle={formatDate(item.order_date || item.created_at || item.pending_profile_data?.requested_at)}
                                        border={group.border}
                                        href={group.href || group.to}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed">
                    <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4 opacity-30" />
                    <p className="text-muted-foreground font-semibold">كل شيء على ما يرام! لا توجد مهام عاجلة.</p>
                </div>
            )}
        </AdminSection>
    );
});
ActionCenterWidget.displayName = "ActionCenterWidget";

export default ActionCenterWidget;
