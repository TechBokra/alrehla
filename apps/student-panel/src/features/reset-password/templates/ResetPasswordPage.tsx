"use client";

import React from 'react';
import { Button } from '@alrehla/ui/button';
import { Lock } from 'lucide-react';
import { getMarketplaceUrl } from '../../../lib/marketplaceUrl';

const ResetPasswordPage: React.FC = () => {
    const marketplaceResetUrl = getMarketplaceUrl("/reset-password");

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg border text-center">
                <div className="mx-auto w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                    <Lock size={32} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-3">استعادة كلمة المرور</h2>
                <p className="text-sm text-gray-600 mb-6">تتم استعادة كلمة المرور من واجهة Clerk المشتركة في تطبيق السوق، ثم يمكنك الرجوع إلى لوحة الطالب.</p>
                <Button type="button" className="w-full" size="lg" onClick={() => window.location.assign(marketplaceResetUrl)}>
                    الانتقال لاستعادة كلمة المرور
                </Button>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
