
import React from 'react';
import { useLocation } from '@/lib/router-compat';
import { ArrowLeft } from 'lucide-react';

export const useHeaderNavigation = () => {
    const location = useLocation();
    const path = location.pathname;

    const mainNavLinks = [
        { key: 'home', to: '/', text: 'الرئيسية' },
        { key: 'enha-lak', to: '/enha-lak', text: 'إنها لك' },
        { key: 'creative-writing', to: '/creative-writing', text: 'بداية الرحلة' },
        { key: 'about', to: '/about', text: 'رحلتنا' },
        { key: 'blog', to: '/blog', text: 'المدونة' },
        { key: 'join-us', to: '/join-us', text: 'انضم إلينا' },
        { key: 'support', to: '/support', text: 'الدعم والمساعدة' },
    ];
    
    const enhaLakNavLinks = [
        { key: 'back', to: '/', text: 'الرئيسية', icon: React.createElement(ArrowLeft, { size: 16 }) },
        { key: 'enha-lak-home', to: '/enha-lak', text: 'عن المشروع' },
        { key: 'enha-lak-store', to: '/enha-lak/store', text: 'المتجر' },
        { key: 'enha-lak-subscription', to: '/enha-lak/subscription', text: 'صندوق الرحلة' },
    ];
    
    const creativeWritingNavLinks = [
        { key: 'back', to: '/', text: 'الرئيسية', icon: React.createElement(ArrowLeft, { size: 16 }) },
        { key: 'cw-home', to: '/creative-writing', text: 'نظرة عامة' },
        { key: 'cw-packages', to: '/creative-writing/packages', text: 'الباقات' },
        { key: 'cw-about', to: '/creative-writing/about', text: 'فلسفة البرنامج' },
        { key: 'cw-instructors', to: '/creative-writing/instructors', text: 'المدربون' },
        { key: 'cw-services', to: '/creative-writing/services', text: 'الخدمات الإبداعية' },
    ];

    if (path.startsWith('/enha-lak')) {
        return {
            currentNavLinks: enhaLakNavLinks,
            headerStyle: 'border-b-4 border-pink-500',
            sectionTitle: 'إنها لك'
        };
    } 
    
    if (path.startsWith('/creative-writing') || path.startsWith('/instructor')) {
        return {
            currentNavLinks: creativeWritingNavLinks,
            headerStyle: 'border-b-4 border-blue-500',
            sectionTitle: 'بداية الرحلة'
        };
    } 
    
    return {
        currentNavLinks: mainNavLinks,
        headerStyle: '',
        sectionTitle: null
    };
};
