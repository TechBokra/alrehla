
import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { useAdminPersonalizedProducts } from '../../../hooks/queries/admin/useAdminEnhaLakQuery';
import PageLoader from '@alrehla/ui/page-loader';
import StatCard from '../../../components/admin/StatCard';
import { Library, PlusCircle, CheckCircle, Eye } from 'lucide-react';
import { Button } from '@alrehla/ui/button';

const createNavigate = (router: ReturnType<typeof useRouter>) => (
    href: string | number,
    options?: { replace?: boolean },
) => {
    if (typeof href === 'number') {
        router.back();
        return;
    }

    const target = href || '/';
    if (options?.replace) router.replace(target);
    else router.push(target);
};

const PublisherDashboardPage: React.FC = () => {
    const { currentUser } = useAuth();
    const router = useRouter();
    const navigate = createNavigate(router);
    // This hook fetches products. We must filter them to ensure we only count THIS publisher's items.
    const { data: allProducts = [], isLoading } = useAdminPersonalizedProducts();

    // Filter strictly by publisher ID
    const myProducts = useMemo(() => {
        if (!currentUser) return [];
        return allProducts.filter(p => p.publisher_id === currentUser.id);
    }, [allProducts, currentUser]);

    if (isLoading) {
        return <PageLoader text="جاري تحميل لوحة التحكم..." />;
    }

    const activeBooks = myProducts.filter(p => p.is_active !== false && p.approval_status === 'approved').length;
    const pendingBooks = myProducts.filter(p => p.approval_status === 'pending').length;
    const totalBooks = myProducts.length;

    return (
        <div className="animate-fadeIn space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-800">مرحباً، {currentUser?.name}</h1>
                    <p className="text-lg text-gray-600 mt-1">لوحة تحكم دار النشر - إدارة الكتب والمطبوعات.</p>
                </div>
                <Button onClick={() => navigate('/publisher-products/new?type=library_book')} icon={<PlusCircle size={18} />}>
                    إضافة كتاب جديد
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                    title="إجمالي كتبي" 
                    value={totalBooks} 
                    icon={<Library className="h-4 w-4 text-blue-500" />} 
                    onClick={() => navigate('/publisher-products')}
                />
                <StatCard 
                    title="كتب منشورة" 
                    value={activeBooks} 
                    icon={<CheckCircle className="h-4 w-4 text-green-500" />} 
                />
                <StatCard 
                    title="قيد المراجعة" 
                    value={pendingBooks} 
                    icon={<Eye className="h-4 w-4 text-orange-500" />} 
                />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-blue-900 mb-2">تعليمات سريعة</h3>
                <ul className="list-disc list-inside text-blue-800 text-sm space-y-2">
                    <li>يمكنك إضافة كتب جديدة من نوع "كتب المكتبة" ليتم عرضها في المتجر العام.</li>
                    <li>تأكد من رفع صورة غلاف عالية الجودة لكل كتاب.</li>
                    <li>الكتب التي تقوم بإضافتها ستخضع للمراجعة قبل الظهور للجمهور.</li>
                </ul>
            </div>
        </div>
    );
};

export default PublisherDashboardPage;
