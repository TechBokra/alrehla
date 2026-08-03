"use client";


import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

const Navigate: React.FC<{ to: string; replace?: boolean }> = ({ to, replace }) => {
  const router = useRouter();
  useEffect(() => {
    if (replace) router.replace(to);
    else router.push(to);
  }, [router, to, replace]);
  return null;
};

const ProfileCompletionGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { 
        currentUser, 
        isProfileMandatory,
    } = useAuth();
    
    const pathname = usePathname();

    // إذا كانت البيانات مطلوبة (isProfileMandatory) والمستخدم ليس في صفحة الحساب بالفعل
    // نقوم بتوجيهه إلى صفحة الحساب مع تمرير الحالة لتفعيل تبويب الإعدادات
    if (isProfileMandatory && currentUser && pathname !== '/account') {
        return <Navigate to="/account?tab=settings" replace />;
    }

    // في جميع الحالات الأخرى، نعرض المحتوى المطلوب
    return <>{children}</>;
};

export default ProfileCompletionGuard;
