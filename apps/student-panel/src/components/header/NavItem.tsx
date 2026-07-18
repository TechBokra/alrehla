"use client";

import React from 'react';
import { NavLink } from '@/lib/router-compat';

interface NavItemProps {
    to: string;
    text: string;
    icon?: React.ReactNode;
    onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ to, text, icon, onClick }) => (
    <NavLink
        to={to}
        end={to === '/'}
        className={({ isActive }) =>
            `flex items-center gap-2 text-sm font-semibold transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary'
            }`
        }
        onClick={onClick}
    >
        {icon}
        <span>{text}</span>
    </NavLink>
);

export default NavItem;
