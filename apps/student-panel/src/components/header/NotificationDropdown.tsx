"use client";


import React from 'react';
import { Link } from '@/lib/router-compat';
import { Button } from '@alrehla/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@alrehla/ui/card';
import { formatDate } from '../../utils/helpers';
import { ShoppingCart, Calendar, Info, Trash2 } from 'lucide-react';

const NotificationIcon: React.FC<{ type: string }> = ({ type }) => {
    switch (type) {
        case 'order': return <ShoppingCart className="w-5 h-5 text-primary" />;
        case 'booking': return <Calendar className="w-5 h-5 text-purple-500" />;
        default: return <Info className="w-5 h-5 text-muted-foreground" />;
    }
};

interface NotificationDropdownProps {
    notifications: any[];
    onClose: () => void;
    onMarkAsRead: (id: number) => void;
    onDelete: (e: React.MouseEvent, id: number) => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ notifications, onClose, onMarkAsRead, onDelete }) => (
    <Card className="absolute top-full left-0 mt-2 w-80 animate-fadeIn z-50 shadow-xl border-gray-200">
        <CardHeader className="p-3 border-b">
            <h3 className="font-semibold text-sm">الإشعارات</h3>
        </CardHeader>
        <CardContent className="p-0 max-h-80 overflow-y-auto custom-scrollbar">
            {notifications.length > 0 ? notifications.map((notif: any) => (
                <Link
                    key={notif.id}
                    to={notif.link}
                    // إذا كان الرابط هو الحساب، نوجه للصفحة الجديدة لتجنب إعادة التوجيه
                    state={notif.link === '/account' ? { defaultTab: 'myLibrary' } : undefined}
                    onClick={() => { onClose(); onMarkAsRead(notif.id); }}
                    className={`flex items-start gap-3 p-3 text-sm hover:bg-accent border-b last:border-0 ${!notif.read ? 'bg-blue-50' : ''}`}
                >
                    <NotificationIcon type={notif.type} />
                    <div className="flex-grow min-w-0">
                        <p className="text-foreground text-xs font-medium leading-relaxed line-clamp-2">{notif.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{formatDate(notif.created_at)}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-red-500 shrink-0" onClick={(e) => onDelete(e, notif.id)}>
                        <Trash2 className="h-3 w-3"/>
                    </Button>
                </Link>
            )) : (
                <p className="p-6 text-center text-sm text-muted-foreground">لا توجد إشعارات جديدة.</p>
            )}
        </CardContent>
        <CardFooter className="p-2 border-t bg-gray-50">
            <Button as={Link} to="/notifications" onClick={onClose} variant="link" size="sm" className="w-full text-xs font-bold">
                عرض سجل الإشعارات الكامل
            </Button>
        </CardFooter>
    </Card>
);

export default React.memo(NotificationDropdown);
