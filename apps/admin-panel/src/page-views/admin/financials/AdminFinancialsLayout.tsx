'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const AdminFinancialsLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const pathname = usePathname();
    const navLinks = [
        { to: '/financials', text: 'نظرة عامة' },
        { to: '/financials/instructor-payouts', text: 'مستحقات المدربين' },
        { to: '/financials/revenue-streams', text: 'مصادر الدخل' },
        { to: '/financials/transactions-log', text: 'سجل المعاملات' },
    ];
    
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-extrabold text-foreground">الماليات</h1>
            <nav className="border-b">
                {navLinks.map(link => {
                    const isActive = link.to === '/financials' ? pathname === link.to : pathname.startsWith(link.to);
                    const className = 'inline-block py-3 px-4 text-sm font-semibold border-b-2 transition-colors ' +
                        (isActive
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground');

                    return (
                        <Link key={link.to} href={link.to} className={className}>
                            {link.text}
                        </Link>
                    );
                })}
            </nav>
            <div className="mt-6">
                {children}
            </div>
        </div>
    );
};

export default AdminFinancialsLayout;
