"use client";


import React from 'react';
import NotificationPanel from '../../../components/account/NotificationPanel';
import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@alrehla/ui/button';

const NotificationsPage: React.FC = () => {
    const router = useRouter();

    return (
        <div className="bg-gray-50 min-h-screen py-8 animate-fadeIn">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="mb-6 flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-muted-foreground">
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
