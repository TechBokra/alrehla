"use client";


import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Link } from '@/lib/router-compat';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useProduct } from '../contexts/ProductContext';
import { useUserNotifications } from '../hooks/queries/user/useUserDataQuery';
import { useNotificationMutations } from '../hooks/mutations/useNotificationMutations';
import { useHeaderNavigation } from '../hooks/useHeaderNavigation'; 
import { 
    ShoppingCart, User, Menu, X, Bell
} from 'lucide-react';
import { Button } from '@alrehla/ui/button';
import NotificationDropdown from './header/NotificationDropdown';
import UserDropdown from './header/UserDropdown';
import NavItem from './header/NavItem';
import MobileMenu from './header/MobileMenu';
import Image from '@alrehla/ui/next-image';

const NotificationListener = dynamic(() => import('./shared/NotificationListener'), { ssr: false });

const Header: React.FC = () => {
    const { isLoggedIn, currentUser, hasAdminAccess, signOut } = useAuth();
    const { itemCount } = useCart();
    const { siteBranding } = useProduct();
    const { data: notifications = [] } = useUserNotifications();
    const { markNotificationAsRead, deleteNotification } = useNotificationMutations();
    
    // Use the new hook to get navigation data
    const { currentNavLinks, headerStyle, sectionTitle } = useHeaderNavigation();

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [openMenu, setOpenMenu] = useState<string | null>(null);

    const menusRef = useRef<{ [key: string]: HTMLElement | null }>({});

    const unreadCount = useMemo(() => notifications.filter((n: any) => !n.read).length, [notifications]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const clickedInside = Object.values(menusRef.current).some(
                (ref) => (ref as HTMLElement | null)?.contains(event.target as Node)
            );
            if (!clickedInside) {
                setOpenMenu(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const closeAllMenus = useCallback(() => {
        setIsMobileMenuOpen(false);
        setOpenMenu(null);
    }, []);

    const toggleMenu = useCallback((menuKey: string) => {
        setOpenMenu(prev => (prev === menuKey ? null : menuKey));
    }, []);

    const handleDeleteNotification = useCallback((e: React.MouseEvent, notificationId: number) => {
        e.stopPropagation();
        e.preventDefault();
        deleteNotification.mutate({ notificationId });
    }, [deleteNotification]);

    return (
        <header className={`bg-background/80 backdrop-blur-md border-b sticky top-0 z-40 ${headerStyle}`} dir="rtl">
            {isLoggedIn && <NotificationListener />}
            
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <Link to="/" className="flex items-center gap-3 group" onClick={closeAllMenus}>
                        {/* Fixed width container for logo to prevent layout shifts (CLS Optimization) */}
                        <div className="h-10 w-10 sm:w-28 relative flex items-center justify-start overflow-hidden">
                            <Image 
                                src={siteBranding?.logoUrl || "/images/favicon.png"} 
                                alt="شعار منصة الرحلة" 
                                className="h-full w-full !bg-transparent object-contain transition-transform group-hover:scale-105" 
                                objectFit="contain"
                                loading="eager" 
                                showSkeleton={false}
                            />
                        </div>
                         <div className="hidden sm:flex items-baseline gap-2">
                             <span className="text-lg font-bold text-foreground">منصة الرحلة</span>
                             {sectionTitle && <span className="text-xs font-semibold text-muted-foreground">| {sectionTitle}</span>}
                        </div>
                    </Link>

                    <nav className="hidden lg:flex items-center gap-6">
                        {currentNavLinks.map(link => <NavItem key={link.key} to={link.to} text={link.text} icon={link.icon} onClick={closeAllMenus} />)}
                    </nav>

                    <div className="flex items-center gap-1 sm:gap-2">
                        <Button as={Link} to="/cart" variant="ghost" size="icon" aria-label="Shopping Cart" className="relative">
                            <ShoppingCart className="h-5 w-5" />
                            {itemCount > 0 && (
                                <span className="absolute -top-1 -right-1 block h-4 w-4 rounded-full bg-pink-500 text-white text-[10px] flex items-center justify-center animate-pulse">
                                    {itemCount}
                                </span>
                            )}
                        </Button>
                        
                        {isLoggedIn ? (
                            <>
                                <div ref={(el) => { menusRef.current['notifications'] = el; }} className="relative">
                                     <Button variant="ghost" size="icon" onClick={() => toggleMenu('notifications')} aria-label="Notifications">
                                        <Bell className={`h-5 w-5 ${unreadCount > 0 ? 'text-primary' : ''}`} />
                                        {unreadCount > 0 && (
                                            <span className="absolute -top-1 -right-1 block h-4 w-4 rounded-full bg-destructive text-white text-[10px] flex items-center justify-center">
                                                {unreadCount}
                                            </span>
                                        )}
                                    </Button>
                                    {openMenu === 'notifications' && (
                                        <NotificationDropdown 
                                            notifications={notifications}
                                            onClose={closeAllMenus}
                                            onMarkAsRead={(id) => markNotificationAsRead.mutate({ notificationId: id })}
                                            onDelete={handleDeleteNotification}
                                        />
                                    )}
                                </div>
                                
                                <div ref={(el) => { menusRef.current['user'] = el; }} className="relative">
                                    <Button variant="ghost" size="icon" onClick={() => toggleMenu('user')} aria-label="User Menu" className="bg-primary/5 hover:bg-primary/10 rounded-full">
                                        <User className="h-5 w-5 text-primary" />
                                    </Button>
                                    {openMenu === 'user' && (
                                        <UserDropdown 
                                            currentUser={currentUser}
                                            hasAdminAccess={hasAdminAccess}
                                            onSignOut={signOut}
                                            onClose={closeAllMenus}
                                        />
                                    )}
                                </div>
                            </>
                        ) : (
                            <Button as={Link} to="/account" size="sm" className="hidden lg:inline-flex">تسجيل الدخول</Button>
                        )}

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="lg:hidden"
                            aria-label="Toggle menu"
                            aria-controls="mobile-menu"
                            aria-expanded={isMobileMenuOpen}
                        >
                            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </Button>
                    </div>
                </div>
            </div>

            {isMobileMenuOpen && (
                <MobileMenu
                    navLinks={currentNavLinks}
                    isLoggedIn={isLoggedIn}
                    onClose={closeAllMenus}
                />
            )}
        </header>
    );
};

export default Header;
