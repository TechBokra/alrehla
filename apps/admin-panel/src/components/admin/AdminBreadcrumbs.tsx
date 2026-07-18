
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, Home } from 'lucide-react';

const routeNameMap: Record<string, string> = {
    'admin': 'لوحة التحكم',
    'users': 'المستخدمين',
    'new': 'إضافة جديد',
    'orders': 'الطلبات',
    'creative-writing': 'حجوزات بداية الرحلة',
    'personalized-products': 'المنتجات',
    'settings': 'الإعدادات',
    'system-config': 'تكوين النظام',
    'instructors': 'المدربون',
    'support': 'الدعم الفني',
    'join-requests': 'طلبات الانضمام',
    'blog': 'المدونة',
    'content': 'إدارة المحتوى',
    'shipping': 'الشحن',
    'subscriptions': 'الاشتراكات',
    'subscription-box': 'صندوق الرحلة',
    'creative-writing-packages': 'الباقات',
    'creative-writing-services': 'الخدمات',
    'service-orders': 'طلبات الخدمات',
    'scheduled-sessions': 'جدول الجلسات',
    'introductory-sessions': 'الجلسات التعريفية',
    'integrations': 'التكاملات',
    'price-review': 'مصفوفة الأسعار',
    'reports': 'التقارير',
    'audit-log': 'سجل النشاطات',
    'database-inspector': 'فحص القاعدة',
    'my-profile': 'ملفي الشخصي',
    'financials': 'الماليات',
    'instructor-payouts': 'مستحقات المدربين',
    'revenue-streams': 'مصادر الدخل',
    'transactions-log': 'سجل المعاملات',
    'profile': 'الملف الشخصي',
    'schedule': 'الجدول',
    'journeys': 'الرحلات',
    'pricing': 'التسعير',
    'instructor-financials': 'الماليات',
    'global': 'عام وتذييل الصفحة',
    'legal': 'الصفحات القانونية',
    'portalPage': 'الصفحة الرئيسية',
    'aboutPage': 'صفحة رحلتنا',
    'enhaLakPage': 'صفحات إنها لك',
    'creativeWritingPage': 'صفحات بداية الرحلة',
    'supportPage': 'صفحة الدعم'
};

const AdminBreadcrumbs: React.FC = () => {
    const pathname = usePathname();
    const pathnames = pathname.split('/').filter((x) => x);

    // إذا كنا في الصفحة الرئيسية للوحة التحكم، لا نعرض شيئاً أو نعرض عنواناً ثابتاً
    if (pathnames.length === 1 && pathnames[0] === 'admin') {
        return null;
    }

    return (
        <nav aria-label="Breadcrumb" className="hidden sm:flex items-center text-sm text-muted-foreground mb-4 animate-fadeIn">
            <ol className="flex items-center gap-1">
                <li>
                    <Link href="/" className="flex items-center hover:text-primary transition-colors">
                        <Home size={14} />
                    </Link>
                </li>
                {pathnames.map((value, index) => {
                    // تخطي "admin" لأنه تم عرضه كأيقونة المنزل
                    if (value === 'admin') return null;

                    const to = `/${pathnames.slice(0, index + 1).join('/')}`;
                    const isLast = index === pathnames.length - 1;
                    
                    // محاولة ترجمة المسار، أو استخدامه كما هو إذا كان رقم (ID)
                    const displayName = routeNameMap[value] || (isNaN(Number(value)) ? value : `#${value.slice(0,6)}`);

                    return (
                        <li key={to} className="flex items-center">
                            <ChevronLeft size={14} className="mx-1 rtl:rotate-180 opacity-50" />
                            {isLast ? (
                                <span className="font-bold text-foreground pointer-events-none max-w-[150px] truncate">
                                    {displayName}
                                </span>
                            ) : (
                                <Link href={to} className="hover:text-primary transition-colors">
                                    {displayName}
                                </Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};

export default AdminBreadcrumbs;
