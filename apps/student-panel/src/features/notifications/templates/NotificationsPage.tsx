"use client";


import React from 'react';
import NotificationPanel from '../../../components/account/NotificationPanel';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from '@/lib/router-compat';
import { Button } from '@alrehla/ui/button';

const NotificationsPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="bg-gray-50 min-h-screen py-8 animate-fadeIn">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="mb-6 flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-muted-foreground">
                        <ArrowRight size={20} className="ml-2" />
                        العودة
                    </Button>
                    <h1 className="text-2xl font-bold text-gray-900">مركز الإشعارات</h1>
                </div>
                
                {/* إعادة استخدام مكون لوحة الإشعارات الموجود مسبقاً */}
                <NotificationPanel />
            </div>
        </div>
    );
};

export default NotificationsPage;
