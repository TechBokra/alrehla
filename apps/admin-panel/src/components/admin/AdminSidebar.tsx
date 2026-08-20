
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useProduct } from '../../contexts/ProductContext';
import {
    LayoutDashboard, Users, ShoppingBag, BookOpen, UserCog, MessageSquare, UserPlus,
    FileText, Settings, Star, Package, Sparkles, CalendarCheck, Plug, DollarSign, BarChart, History, X,
    Globe, Home, Info, HelpCircle, Shield, Server, Library, Wallet, Bell
} from 'lucide-react';
import { cn } from '../../lib/utils';
import Image from '@alrehla/ui/image';
import { Button } from '@alrehla/ui/button';

interface NavItemProps {
    to: string;
    icon: React.ReactNode;
    label: string;
    isCollapsed: boolean;
    onClick?: () => void;
}

interface NavGroup {
    title?: string;
    items: {
        to: string;
        icon: React.ReactNode;
        label: string;
        permission: boolean;
    }[];
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, isCollapsed, onClick }) => {
    const pathname = usePathname();
    const isActive = to === '/' ? pathname === '/' : pathname.startsWith(to);

    return (
        <Link
            href={to}
            onClick={onClick}
            className={cn(
                "flex items-center p-3 rounded-lg text-sm font-semibold transition-colors",
                isActive ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted/50",
                isCollapsed ? "justify-center" : "gap-4"
            )}
        >
            {icon}
            {!isCollapsed && <span>{label}</span>}
        </Link>
    );
};

interface AdminSidebarProps {
    isCollapsed: boolean;
    isMobileOpen: boolean;
    onMobileClose: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ isCollapsed, isMobileOpen, onMobileClose }) => {
    const { permissions } = useAuth();
    const { siteBranding } = useProduct();
    
    const isPublisherOnly = permissions.isPublisher && !permissions.canViewGlobalStats;

    const renderNavContent = (navItems: (NavGroup | NavItemProps)[]) => (
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
             {navItems.map((groupOrItem, index) => {
                // Check if it's a direct NavItem
                if ('to' in groupOrItem) {
                     const item = groupOrItem as NavItemProps & { permission?: boolean };
                     return item.permission !== false ? <NavItem key={item.to} {...item} isCollapsed={isCollapsed} onClick={onMobileClose} /> : null;
                }
                
                // It's a Group
                const group = groupOrItem as NavGroup;
                const filteredItems = group.items.filter(item => item.permission);
                
                if (filteredItems.length === 0) return null;
                
                return (
                    <div key={index} className="mb-4">
                        {!isCollapsed && group.title && (
                            <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{group.title}</h3>
                        )}
                        <div className="space-y-1">
                            {filteredItems.map((item) => <NavItem key={item.to} {...item} isCollapsed={isCollapsed} onClick={onMobileClose} />)}
                        </div>
                    </div>
                );
            })}
        </nav>
    );

    let navigationContent;

    if (isPublisherOnly) {
        const publisherNav = [
            { to: '/', icon: <LayoutDashboard size={20} />, label: 'لوحة التحكم', permission: true },
            { to: '/publisher-products', icon: <Library size={20} />, label: 'إدارة كتبي', permission: permissions.canManageOwnProducts },
            { to: '/notifications', icon: <Bell size={20} />, label: 'الإشعارات', permission: true },
            { to: '/publisher-financials', icon: <Wallet size={20} />, label: 'الماليات', permission: true },
            { to: '/my-profile', icon: <UserCog size={20} />, label: 'إعدادات الحساب', permission: true },
        ];
        
        navigationContent = renderNavContent(publisherNav.map(i => ({ ...i, onClick: onMobileClose, isCollapsed })));
    } else {
        const adminNavGroups: NavGroup[] = [
            {
                items: [
                    { to: '/', icon: <LayoutDashboard size={20} />, label: 'لوحة التحكم', permission: permissions.canViewDashboard },
                    { to: '/notifications', icon: <Bell size={20} />, label: 'الإشعارات', permission: true },
                ]
            },
            {
                title: 'الإدارة والطلبات',
                items: [
                    { to: '/users', icon: <Users size={20} />, label: 'المستخدمون', permission: permissions.canManageUsers },
                    { to: '/instructors', icon: <UserCog size={20} />, label: 'المدربون', permission: permissions.canManageInstructors },
                    { to: '/support', icon: <MessageSquare size={20} />, label: 'رسائل الدعم', permission: permissions.canManageSupportTickets },
                    { to: '/join-requests', icon: <UserPlus size={20} />, label: 'طلبات الانضمام', permission: permissions.canManageJoinRequests },
                ]
            },
            {
                title: 'الماليات والتقارير',
                items: [
                     { to: '/financials', icon: <DollarSign size={20} />, label: 'الماليات', permission: permissions.canManageFinancials },
                     { to: '/reports', icon: <BarChart size={20} />, label: 'التقارير', permission: permissions.canManageFinancials },
                ]
            },
            {
                title: 'إنها لك',
                items: [
                    { to: '/orders', icon: <ShoppingBag size={20} />, label: 'الطلبات', permission: permissions.canManageEnhaLakOrders },
                    { to: '/personalized-products', icon: <Package size={20} />, label: 'المنتجات', permission: permissions.canManageEnhaLakProducts },
                    { to: '/subscriptions', icon: <Star size={20} />, label: 'الاشتراكات', permission: permissions.canManageEnhaLakOrders },
                    { to: '/subscription-box', icon: <Settings size={20} />, label: 'إعدادات الصندوق', permission: permissions.canManageEnhaLakProducts },
                ]
            },
            {
                title: 'بداية الرحلة',
                items: [
                    { to: '/creative-writing', icon: <BookOpen size={20} />, label: 'الحجوزات', permission: permissions.canManageCreativeWritingBookings },
                    { to: '/scheduled-sessions', icon: <CalendarCheck size={20} />, label: 'إدارة الجلسات', permission: permissions.canManageCreativeWritingBookings },
                    { to: '/service-orders', icon: <Sparkles size={20} />, label: 'طلبات الخدمات', permission: permissions.canManageCreativeWritingBookings },
                    { to: '/price-review', icon: <DollarSign size={20} />, label: 'مصفوفة الأسعار', permission: permissions.canManageInstructors },
                    { to: '/creative-writing-packages', icon: <Package size={20} />, label: 'إدارة الباقات', permission: permissions.canManageCreativeWritingSettings },
                    { to: '/creative-writing-services', icon: <Sparkles size={20} />, label: 'إدارة الخدمات', permission: permissions.canManageCreativeWritingSettings },
                ]
            },
            {
                title: 'إدارة المحتوى',
                items: [
                     { to: '/content/global', icon: <Globe size={20} />, label: 'عام وتذييل الصفحة', permission: permissions.canManageSiteContent },
                     { to: '/content/legal', icon: <Shield size={20} />, label: 'الصفحات القانونية', permission: permissions.canManageSiteContent },
                     { to: '/content/portalPage', icon: <Home size={20} />, label: 'الصفحة الرئيسية', permission: permissions.canManageSiteContent },
                     { to: '/content/aboutPage', icon: <Info size={20} />, label: 'صفحة رحلتنا', permission: permissions.canManageSiteContent },
                     { to: '/content/enhaLakPage', icon: <ShoppingBag size={20} />, label: 'صفحات إنها لك', permission: permissions.canManageSiteContent },
                     { to: '/content/creativeWritingPage', icon: <BookOpen size={20} />, label: 'صفحات بداية الرحلة', permission: permissions.canManageSiteContent },
                     { to: '/content/supportPage', icon: <HelpCircle size={20} />, label: 'صفحة الدعم', permission: permissions.canManageSiteContent },
                     { to: '/blog', icon: <FileText size={20} />, label: 'المدونة', permission: permissions.canManageBlog },
                ]
            },
            {
                title: 'إعدادات النظام',
                items: [
                     { to: '/settings', icon: <Settings size={20} />, label: 'الإعدادات العامة', permission: permissions.canManageSettings },
                     { to: '/system-config', icon: <Server size={20} />, label: 'تكوين النظام', permission: permissions.canManageSettings },
                     { to: '/audit-log', icon: <History size={20} />, label: 'سجل النشاطات', permission: permissions.canViewAuditLog },
                     { to: '/database-inspector', icon: <Settings size={20} />, label: 'مراقب القاعدة', permission: permissions.canManageSettings },
                     { to: '/integrations', icon: <Plug size={20} />, label: 'التكاملات', permission: permissions.canManageSettings },
                ]
            },
        ];
        navigationContent = renderNavContent(adminNavGroups);
    }

    return (
        <aside className={cn(
            "bg-background border-l rtl:border-l-0 rtl:border-r transition-all duration-300 flex flex-col",
            "fixed inset-y-0 right-0 z-[60] h-full w-64 shadow-2xl transform",
            !isMobileOpen && "translate-x-full", 
            "md:translate-x-0 md:static md:h-auto md:shadow-none md:z-0",
            isCollapsed ? "md:w-20" : "md:w-64"
        )}>
            <div className="flex items-center justify-between h-16 border-b p-4">
                <Link href="/" className="flex items-center gap-2" onClick={onMobileClose}>
                    <div className="h-8 w-8 relative">
                        <Image 
                            src={siteBranding?.logoUrl || "https://i.ibb.co/C0bSJJT/favicon.png"} 
                            alt="شعار" 
                            className="h-full w-full !bg-transparent" 
                            objectFit="contain"
                        />
                    </div>
                    {!isCollapsed && <span className="font-bold text-lg">منصة الرحلة</span>}
                </Link>
                <Button variant="ghost" size="icon" onClick={onMobileClose} className="md:hidden">
                    <X size={20} />
                </Button>
            </div>
            {navigationContent}
        </aside>
    );
};

export default AdminSidebar;
