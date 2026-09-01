'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useClerk, useUser } from '@clerk/nextjs';
import { useUserNotifications } from '../../hooks/queries/user/useUserDataQuery';
import { useNotificationMutations } from '../../hooks/mutations/useNotificationMutations';
import Link from 'next/link';
import { Menu, LogOut, PanelRightOpen, PanelRightClose, User, Bell } from 'lucide-react';
import { Button } from '@alrehla/ui/button';
import type { Notification } from '@alrehla/types';
import NotificationDropdown from '../header/NotificationDropdown';

interface InstructorNavbarProps {
    onMobileMenuToggle: () => void;
    isSidebarCollapsed: boolean;
    onSidebarToggle: () => void;
}

const InstructorNavbar: React.FC<InstructorNavbarProps> = ({
    onMobileMenuToggle,
    isSidebarCollapsed,
    onSidebarToggle,
}) => {
    const { user } = useUser();
    const { signOut } = useClerk();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

    const userName = user?.fullName || user?.firstName || user?.primaryEmailAddress?.emailAddress || 'المدرب';
    const userEmail = user?.primaryEmailAddress?.emailAddress || '';
    
    const menuRef = useRef<HTMLDivElement>(null);
    const notificationsRef = useRef<HTMLDivElement>(null);

    const { data: notifications = [] } = useUserNotifications();
    const { markNotificationAsRead, deleteNotification } = useNotificationMutations();

    const unreadCount = useMemo(() => notifications.filter((n: Notification) => !n.read).length, [notifications]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
                setIsNotificationsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleDeleteNotification = (e: React.MouseEvent, notificationId: number) => {
        e.stopPropagation();
        e.preventDefault();
        deleteNotification.mutate({ notificationId });
    };

    return (
        <header className="flex-shrink-0 bg-background border-b z-30 sticky top-0">
            <div className="flex items-center justify-between h-16 px-6">
                <div className="flex items-center gap-4">
                    {/* Mobile Menu Button */}
                    <Button onClick={onMobileMenuToggle} variant="ghost" size="icon" className="md:hidden">
                        <Menu size={24} />
                    </Button>

                    {/* Desktop Sidebar Toggle */}
                    <Button onClick={onSidebarToggle} variant="ghost" size="icon" className="hidden md:block text-muted-foreground hover:text-foreground">
                        {isSidebarCollapsed ? <PanelRightOpen size={20} /> : <PanelRightClose size={20} />}
                    </Button>

                    <div className="hidden sm:flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                        <span>لوحة تحكم المدرب</span>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    {/* Notifications Dropdown */}
                    <div className="relative" ref={notificationsRef}>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setIsNotificationsOpen(prev => !prev)} 
                            className="relative text-muted-foreground hover:text-foreground"
                            aria-label="Notifications"
                        >
                            <Bell className={`h-5 w-5 ${unreadCount > 0 ? 'animate-pulse text-primary' : ''}`} />
                            {unreadCount > 0 && (
                                <span className="absolute top-1.5 right-1.5 block h-2.5 w-2.5 rounded-full bg-destructive ring-2 ring-background"></span>
                            )}
                        </Button>
                        {isNotificationsOpen && (
                            <NotificationDropdown 
                                notifications={notifications} 
                                onClose={() => setIsNotificationsOpen(false)}
                                onMarkAsRead={(id) => markNotificationAsRead.mutate({ notificationId: id })}
                                onDelete={handleDeleteNotification}
                            />
                        )}
                    </div>

                    {/* User Profile Dropdown */}
                    <div className="relative" ref={menuRef}>
                        <Button
                            variant="ghost"
                            onClick={() => setIsMenuOpen(prev => !prev)}
                            className="flex items-center gap-2 p-1.5 rounded-full hover:bg-accent"
                        >
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                                {userName.charAt(0)}
                            </div>
                            <span className="hidden md:inline-block text-xs font-semibold text-foreground max-w-[120px] truncate">
                                {userName}
                            </span>
                        </Button>

                        {isMenuOpen && (
                            <div className="absolute left-0 mt-2 w-48 rounded-xl bg-card border shadow-lg py-1.5 z-50 animate-fadeIn text-right">
                                <div className="px-4 py-2 border-b">
                                    <p className="text-xs font-bold text-foreground truncate">{userName}</p>
                                    <p className="text-[10px] text-muted-foreground truncate">{userEmail}</p>
                                </div>
                                <Link
                                    href="/profile"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center gap-2 px-4 py-2 text-xs text-foreground hover:bg-accent"
                                >
                                    <User size={14} />
                                    <span>ملفي الشخصي</span>
                                </Link>
                                <button
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        void signOut({ redirectUrl: '/login' });
                                    }}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-xs text-destructive hover:bg-destructive/10"
                                >
                                    <LogOut size={14} />
                                    <span>تسجيل الخروج</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default InstructorNavbar;
