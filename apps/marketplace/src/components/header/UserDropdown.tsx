"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from '@/lib/router-compat';
import { Avatar, AvatarFallback, AvatarImage } from '@alrehla/ui/components/ui/avatar';
import { Button } from '@alrehla/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@alrehla/ui/components/ui/popover';
import { Separator } from '@alrehla/ui/components/ui/separator';
import { getDashboardDestinationForRole } from '../../lib/dashboardRedirect';
import { resolveStoredImageUrl } from '../../lib/imageUrl';
import type { UserProfile } from '../../lib/database.types';
import { LayoutDashboard, LogOut, Moon, Settings, Sun } from 'lucide-react';

const THEME_STORAGE_KEY = 'alrehla-theme';

const getInitials = (name?: string | null, email?: string | null) => {
    const source = (name || email || 'مستخدم').trim();
    const parts = source.split(/\s+/).filter(Boolean);

    if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }

    return source.slice(0, 2).toUpperCase();
};

const getStoredDarkMode = () => {
    if (typeof window === 'undefined') return false;
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

    if (storedTheme === 'dark') return true;
    if (storedTheme === 'light') return false;

    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
};

interface UserDropdownProps {
    currentUser: UserProfile | null;
    onSignOut: () => void;
    onClose: () => void;
}

const UserDropdown: React.FC<UserDropdownProps> = ({ currentUser, onSignOut, onClose }) => {
    const [open, setOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const dashboardDestination = useMemo(
        () => getDashboardDestinationForRole(currentUser?.role),
        [currentUser?.role],
    );
    const initials = useMemo(
        () => getInitials(currentUser?.name, currentUser?.email),
        [currentUser?.email, currentUser?.name],
    );
    const avatarUrl = resolveStoredImageUrl(
        (currentUser as any)?.avatar_url || (currentUser as any)?.imageUrl,
    );

    useEffect(() => {
        const nextIsDark = getStoredDarkMode();
        setIsDarkMode(nextIsDark);
        document.documentElement.classList.toggle('dark', nextIsDark);
    }, []);

    const closeMenu = useCallback(() => {
        setOpen(false);
        onClose();
    }, [onClose]);

    const toggleTheme = useCallback(() => {
        setIsDarkMode((current) => {
            const next = !current;
            document.documentElement.classList.toggle('dark', next);
            window.localStorage.setItem(THEME_STORAGE_KEY, next ? 'dark' : 'light');
            return next;
        });
    }, []);

    const handleSignOut = useCallback(async () => {
        closeMenu();
        await onSignOut();
    }, [closeMenu, onSignOut]);

    const menuItemClass = 'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground';

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label="قائمة المستخدم"
                    className="rounded-full p-0 hover:bg-primary/10"
                >
                    <Avatar className="h-9 w-9 border border-primary/20 bg-primary/10">
                        {avatarUrl && <AvatarImage src={avatarUrl} alt={currentUser?.name || 'حساب المستخدم'} />}
                        <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72 p-0" dir="rtl">
                <div className="p-4">
                    <p className="text-sm font-semibold">مرحباً، {currentUser?.name || 'مستخدم الرحلة'}</p>
                    <p className="mt-1 truncate text-xs text-muted-foreground" dir="ltr">
                        {currentUser?.email}
                    </p>
                </div>

                <Separator />

                <div className="space-y-1 p-2">
                    {dashboardDestination.external ? (
                        <a href={dashboardDestination.href} onClick={closeMenu} className={menuItemClass}>
                            <LayoutDashboard className="h-4 w-4" />
                            {dashboardDestination.label}
                        </a>
                    ) : (
                        <Link to={dashboardDestination.href} onClick={closeMenu} className={menuItemClass}>
                            <LayoutDashboard className="h-4 w-4" />
                            {dashboardDestination.label}
                        </Link>
                    )}

                    <Link to="/account?tab=settings" onClick={closeMenu} className={menuItemClass}>
                        <Settings className="h-4 w-4" />
                        إعدادات الحساب
                    </Link>

                    <button type="button" onClick={toggleTheme} className={menuItemClass}>
                        {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        {isDarkMode ? 'الوضع الفاتح' : 'الوضع الداكن'}
                    </button>
                </div>

                <Separator />

                <div className="p-2">
                    <button
                        type="button"
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                    >
                        <LogOut className="h-4 w-4" />
                        تسجيل الخروج
                    </button>
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default React.memo(UserDropdown);
