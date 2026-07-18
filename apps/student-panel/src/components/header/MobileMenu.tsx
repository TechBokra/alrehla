"use client";


import React from 'react';
import { Link } from '@/lib/router-compat';
import NavItem from './NavItem';
import { Button } from '@alrehla/ui/button';

interface MobileMenuProps {
    navLinks: { key: string; to: string; text: string; icon?: React.ReactNode }[];
    isLoggedIn: boolean;
    onClose: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ navLinks, isLoggedIn, onClose }) => (
    <div id="mobile-menu" className="lg:hidden bg-background border-t">
        <nav className="flex flex-col items-center gap-6 p-6">
            {navLinks.map(link => (
                <NavItem key={link.key} to={link.to} text={link.text} icon={link.icon} onClick={onClose} />
            ))}
            {!isLoggedIn && (
                <Button as={Link} to="/account" onClick={onClose} size="default">تسجيل الدخول</Button>
            )}
        </nav>
    </div>
);

export default React.memo(MobileMenu);
