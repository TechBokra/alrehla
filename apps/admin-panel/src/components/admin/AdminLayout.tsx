'use client';

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AdminSidebar from './AdminSidebar';
import AdminNavbar from './AdminNavbar';
import AdminFooter from './AdminFooter';
import PageLoader from '@alrehla/ui/page-loader';
import NotificationListener from '../shared/NotificationListener';

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const { loading: authLoading } = useAuth();

    if (authLoading) return <PageLoader text="جاري التحقق من الصلاحيات..." />;

    return (
        <div className="flex h-screen bg-muted/30 overflow-hidden" dir="rtl">
            {/* إضافة مستمع الإشعارات هنا لضمان عمله داخل لوحة التحكم */}
            <NotificationListener />

            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 md:hidden animate-fadeIn"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            <AdminSidebar 
                isCollapsed={isSidebarCollapsed} 
                isMobileOpen={isMobileMenuOpen}
                onMobileClose={() => setIsMobileMenuOpen(false)}
            />
            
            <main className="flex-1 flex flex-col w-full md:w-auto min-w-0 overflow-hidden relative transition-all duration-300">
                <AdminNavbar 
                    onMobileMenuToggle={() => setIsMobileMenuOpen(prev => !prev)} 
                    isSidebarCollapsed={isSidebarCollapsed} 
                    onSidebarToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                />
                
                <div className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth relative">
                    <div className="flex flex-col min-h-full">
                         <div className="flex-1 p-4 sm:p-6 lg:p-8">
                            {children}
                         </div>
                         <AdminFooter />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
