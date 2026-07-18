"use client";

import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, Shield, BookOpen, PenTool, UserCheck, MessageSquare, Edit, GraduationCap, ShoppingBag } from 'lucide-react';

const mockUsersCredentials = [
    { role: 'ولي أمر', email: 'parent@alrehlah.com', icon: <User /> },
    { role: 'مستخدم عادي', email: 'user@alrehlah.com', icon: <User /> },
    { role: 'طالب', email: 'student@alrehlah.com', icon: <GraduationCap /> },
    { role: 'مدير النظام', email: 'admin@alrehlah.com', icon: <Shield /> },
    { role: 'مشرف عام', email: 'supervisor@alrehlah.com', icon: <BookOpen /> },
    { role: 'مشرف إنها لك', email: 'enhalak@alrehlah.com', icon: <ShoppingBag /> },
    { role: 'مشرف بداية الرحلة', email: 'cws@alrehlah.com', icon: <PenTool /> },
    { role: 'مدرب', email: 'instructor@alrehlah.com', icon: <UserCheck /> },
    { role: 'وكيل دعم', email: 'support@alrehlah.com', icon: <MessageSquare /> },
    { role: 'محرر محتوى', email: 'editor@alrehlah.com', icon: <Edit /> },
];
const DEMO_PASSWORD = '123456';

const DemoLogins: React.FC = () => {
    const { signIn, loading } = useAuth();

    return (
        <div className="bg-gray-50 p-8 rounded-2xl border border-dashed">
            <h3 className="text-xl font-bold text-center mb-4">أو استخدم الدخول السريع (للتجربة)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {mockUsersCredentials.map(({ role, email, icon }) => (
                    <button
                        key={email}
                        onClick={() => signIn(email, DEMO_PASSWORD)}
                        disabled={loading}
                        className="flex items-center gap-3 w-full p-4 bg-white border rounded-lg text-right font-semibold transition-colors text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                    >
                        {icon}
                        <span>{role}</span>
                    </button>
                ))}
            </div>
             <p className="text-xs text-gray-500 mt-6 text-center">كلمة المرور لجميع الحسابات التجريبية هي: <span className="font-mono">123456</span></p>
        </div>
    );
}

export default DemoLogins;