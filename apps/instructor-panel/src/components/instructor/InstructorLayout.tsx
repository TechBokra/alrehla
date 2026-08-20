'use client';

import React, { useState } from 'react';
import InstructorSidebar from './InstructorSidebar';
import InstructorNavbar from './InstructorNavbar';
import InstructorFooter from './InstructorFooter';
import NotificationListener from '../shared/NotificationListener';

const InstructorLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    return (
        <div className="flex h-screen bg-muted/30 overflow-hidden" dir="rtl">
            <NotificationListener />

            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 md:hidden animate-fadeIn"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            <InstructorSidebar 
                isCollapsed={isSidebarCollapsed} 
                isMobileOpen={isMobileMenuOpen}
                onMobileClose={() => setIsMobileMenuOpen(false)}
            />
            
            <main className="flex-1 flex flex-col w-full md:w-auto min-w-0 overflow-hidden relative transition-all duration-300">
                <InstructorNavbar 
                    onMobileMenuToggle={() => setIsMobileMenuOpen(prev => !prev)} 
                    isSidebarCollapsed={isSidebarCollapsed} 
                    onSidebarToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                />
                
                <div className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth relative">
                    <div className="flex flex-col min-h-full">
                         <div className="flex-1 p-4 sm:p-6 lg:p-8">
                            {children}
                         </div>
                         <InstructorFooter />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default InstructorLayout;
