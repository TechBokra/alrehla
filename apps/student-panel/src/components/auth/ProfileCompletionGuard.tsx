"use client";


import React from 'react';
import { Navigate, useLocation } from '@/lib/router-compat';
import { useAuth } from '../../contexts/AuthContext';

const ProfileCompletionGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { 
        currentUser, 
        isProfileMandatory,
    } = useAuth();
    
    const location = useLocation();

    // إذا كانت البيانات مطلوبة (isProfileMandatory) والمستخدم ليس في صفحة الحساب بالفعل
    // نقوم بتوجيهه إلى صفحة الحساب مع تمرير الحالة لتفعيل تبويب الإعدادات
    if (isProfileMandatory && currentUser && location.pathname !== '/account') {
        return <Navigate to="/account" state={{ defaultTab: 'settings', from: location.pathname }} replace />;
    }

    // في جميع الحالات الأخرى، نعرض المحتوى المطلوب
    return <>{children}</>;
};

export default ProfileCompletionGuard;
