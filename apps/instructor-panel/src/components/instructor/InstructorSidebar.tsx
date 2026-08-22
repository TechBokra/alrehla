'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
    LayoutDashboard, 
    CalendarCheck, 
    BookOpen, 
    UserCog, 
    DollarSign, 
    Wallet, 
    Bell,
    X,
    LogOut,
    ExternalLink
} from 'lucide-react';
import { useClerk, useUser } from '@clerk/nextjs';
import { getMarketplaceUrl } from '../../lib/marketplaceUrl';
import { Button } from '@alrehla/ui/button';
import { AlrehlaLogo } from '@alrehla/ui';

interface NavItemProps {
    to: string;
    icon: React.ReactNode;
    label: string;
    isCollapsed: boolean;
    onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, isCollapsed, onClick }) => {
    const pathname = usePathname();
    const isActive = to === '/' ? pathname === '/' : pathname.startsWith(to);

    return (
        <Link
            href={to}
            onClick={onClick}
            title={isCollapsed ? label : undefined}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                isActive 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            } ${isCollapsed ? 'justify-center px-2' : ''}`}
        >
            <span className="shrink-0">{icon}</span>
            {!isCollapsed && <span className="truncate">{label}</span>}
        </Link>
    );
};

interface InstructorSidebarProps {
    isCollapsed: boolean;
    isMobileOpen: boolean;
    onMobileClose: () => void;
}

const INSTRUCTOR_NAV_ITEMS = [
    { to: '/', icon: <LayoutDashboard size={20} />, label: 'لوحة التحكم' },
    { to: '/schedule', icon: <CalendarCheck size={20} />, label: 'جدولي ومواعيدي' },
    { to: '/journeys', icon: <BookOpen size={20} />, label: 'رحلات الطلاب' },
    { to: '/profile', icon: <UserCog size={20} />, label: 'ملفي الشخصي' },
    { to: '/pricing', icon: <DollarSign size={20} />, label: 'التسعير' },
    { to: '/financials', icon: <Wallet size={20} />, label: 'الماليات والمستحقات' },
    { to: '/notifications', icon: <Bell size={20} />, label: 'الإشعارات' },
];

const InstructorSidebar: React.FC<InstructorSidebarProps> = ({
    isCollapsed,
    isMobileOpen,
    onMobileClose,
}) => {
    const { user } = useUser();
    const { signOut } = useClerk();

    const userName = user?.fullName || user?.firstName || user?.primaryEmailAddress?.emailAddress || 'المدرب';

    return (
        <aside
            className={`fixed inset-y-0 right-0 z-50 flex flex-col bg-card border-l transition-all duration-300 md:static ${
                isCollapsed ? 'w-20' : 'w-64'
            } ${
                isMobileOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
            }`}
        >
            {/* Header / Logo */}
            <div className="flex items-center justify-between h-16 px-4 border-b">
                <Link href="/" className="flex items-center gap-2 overflow-hidden">
                    <AlrehlaLogo size="md" />
                    {!isCollapsed && (
                        <div className="flex flex-col">
                            <span className="font-bold text-sm text-foreground">بوابة المدرب</span>
                            <span className="text-[10px] text-muted-foreground">منصة الرحلة</span>
                        </div>
                    )}
                </Link>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onMobileClose}
                    className="md:hidden text-muted-foreground"
                >
                    <X size={20} />
                </Button>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
                {INSTRUCTOR_NAV_ITEMS.map((item) => (
                    <NavItem
                        key={item.to}
                        to={item.to}
                        icon={item.icon}
                        label={item.label}
                        isCollapsed={isCollapsed}
                        onClick={onMobileClose}
                    />
                ))}
            </nav>

            {/* Footer / User Profile & Logout */}
            <div className="p-3 border-t space-y-2 bg-muted/20">
                <a
                    href={getMarketplaceUrl('/')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground rounded-md hover:bg-accent transition-colors ${
                        isCollapsed ? 'justify-center px-2' : ''
                    }`}
                    title={isCollapsed ? 'زيارة المنصة الرئيسية' : undefined}
                >
                    <ExternalLink size={16} />
                    {!isCollapsed && <span>زيارة المنصة الرئيسية</span>}
                </a>

                <div className={`flex items-center gap-3 p-2 rounded-lg bg-background border ${
                    isCollapsed ? 'justify-center p-2' : ''
                }`}>
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                        {userName.charAt(0)}
                    </div>
                    {!isCollapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate text-foreground">{userName}</p>
                            <p className="text-[10px] text-muted-foreground truncate">مدرب معتمد</p>
                        </div>
                    )}
                    {!isCollapsed && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => void signOut({ redirectUrl: '/login' })}
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            title="تسجيل الخروج"
                        >
                            <LogOut size={14} />
                        </Button>
                    )}
                </div>
            </div>
        </aside>
    );
};

export default InstructorSidebar;
