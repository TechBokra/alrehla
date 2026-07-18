"use client";


import React from 'react';
import { Link } from '@/lib/router-compat';
import NavItem from './NavItem';
import { Button } from '@alrehla/ui/button';
import { LayoutDashboard } from 'lucide-react';
import type { DashboardDestination } from '../../lib/dashboardRedirect';

interface MobileMenuProps {
    navLinks: { key: string; to: string; text: string; icon?: React.ReactNode }[];
    isLoggedIn: boolean;
    dashboardDestination?: DashboardDestination | null;
    onClose: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ navLinks, isLoggedIn, dashboardDestination, onClose }) => (
    <div id="mobile-menu" className="lg:hidden bg-background border-t">
        <nav className="flex flex-col items-center gap-6 p-6">
            {navLinks.map(link => (
                <NavItem key={link.key} to={link.to} text={link.text} icon={link.icon} onClick={onClose} />
            ))}
            {isLoggedIn && dashboardDestination && (
                dashboardDestination.external ? (
                    <Button as="a" href={dashboardDestination.href} onClick={onClose} size="default" variant="outline">
                        <LayoutDashboard className="h-4 w-4" />
                        {dashboardDestination.label}
                    </Button>
                ) : (
                    <Button as={Link} to={dashboardDestination.href} onClick={onClose} size="default" variant="outline">
                        <LayoutDashboard className="h-4 w-4" />
                        {dashboardDestination.label}
                    </Button>
                )
            )}
            {!isLoggedIn && (
                <Button as={Link} to="/account" onClick={onClose} size="default">تسجيل الدخول</Button>
            )}
        </nav>
    </div>
);

export default React.memo(MobileMenu);
