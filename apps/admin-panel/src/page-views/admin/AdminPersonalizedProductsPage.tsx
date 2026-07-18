
import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Gift, Plus, Edit, Trash2, Star, Puzzle, Check, X, Settings, Box, Sparkles, BookHeart, Library, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useAdminPersonalizedProducts } from '../../hooks/queries/admin/useAdminEnhaLakQuery';
import { useProductMutations } from '../../hooks/mutations/useProductMutations';
import PageLoader from '@alrehla/ui/page-loader';
import type { PersonalizedProduct } from '../../lib/database.types';
import { Button } from '@alrehla/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@alrehla/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@alrehla/ui/table';
import ErrorState from '@alrehla/ui/error-state';
import SortableTableHead from '../../components/admin/ui/SortableTableHead';
import Dropdown from '@alrehla/ui/dropdown-wrapper';
import Image from '@alrehla/ui/image';
import { formatCurrency } from '../../utils/helpers';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@alrehla/ui/tabs';

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

const AdminPersonalizedProductsPage: React.FC = () => {
    const router = useRouter();
    const navigate = createNavigate(router);
    const { data: personalizedProducts = [], isLoading, error, refetch } = useAdminPersonalizedProducts();
    const { deletePersonalizedProduct, approveProduct } = useProductMutations();
    const [sortConfig, setSortConfig] = useState<{ key: keyof PersonalizedProduct; direction: 'asc' | 'desc' } | null>({ key: 'sort_order', direction: 'asc' });
    const [activeTab, setActiveTab] = useState('hero');
    
    // تصنيف المنتجات حسب التبويب
    const filteredProducts = useMemo(() => {
        let products = personalizedProducts;
        
        // 1. التصفية حسب التبويب
        if (activeTab === 'hero') {
            products = personalizedProducts.filter(p => 
                (p.product_type === 'hero_story' || !p.product_type) && 
                !p.is_addon && 
                p.key !== 'subscription_box'
            );
        } else if (activeTab === 'library') {
            products = personalizedProducts.filter(p => p.product_type === 'library_book' && !p.is_addon && p.approval_status !== 'pending');
        } else if (activeTab === 'addons') {
            products = personalizedProducts.filter(p => p.is_addon && p.approval_status !== 'pending');
        } else if (activeTab === 'subscription') {
            products = personalizedProducts.filter(p => p.key === 'subscription_box' || p.product_type === 'subscription_box');
        } else if (activeTab === 'pending') {
            products = personalizedProducts.filter(p => p.approval_status === 'pending');
        }

        // 2. الترتيب
        if (sortConfig !== null) {
            products.sort((a, b) => {
                const aVal = a[sortConfig.key];
                const bVal = b[sortConfig.key];
                if (aVal === null || aVal === undefined) return 1;
                if (bVal === null || bVal === undefined) return -1;
                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return products;
    }, [personalizedProducts, sortConfig, activeTab]);

    const handleSort = (key: keyof PersonalizedProduct) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleDeleteProduct = async (productId: number) => {
        if (window.confirm('هل أنت متأكد من حذف هذا المنتج؟ هذه العملية لا يمكن التراجع عنها.')) {
            await deletePersonalizedProduct.mutateAsync({ productId });
        }
    };

    const addProductOptions = [
        { 
            label: 'قصة بطل (تخصيص كامل)', 
            action: () => navigate('/personalized-products/new?type=hero_story'),
            icon: <Sparkles size={16} />
        },
        { 
            label: 'كتاب مكتبة (غلاف فقط)', 
            action: () => navigate('/personalized-products/new?type=library_book'),
            icon: <BookHeart size={16} />
        },
        { 
            label: 'إضافة جديدة (Addon)', 
            action: () => navigate('/personalized-products/new?type=addon'),
            icon: <Puzzle size={16} />
        },
        { 
            label: 'صندوق اشتراك', 
            action: () => navigate('/personalized-products/new?type=subscription_box'),
            icon: <Box size={16} />
        }
    ];

    // Count pending items
    const pendingCount = personalizedProducts.filter(p => p.approval_status === 'pending').length;

    if (isLoading) return <PageLoader text="جاري تحميل المنتجات..." />;
    if (error) return <ErrorState message={(error as Error).message} onRetry={refetch} />;

    return (
        <div className="animate-fadeIn space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-extrabold text-foreground">إدارة المنتجات</h1>
                <Dropdown 
                    trigger={
                        <span className="flex items-center gap-2">
                            <Plus size={18} /> إضافة جديد
                        </span>
                    }
                    items={addProductOptions}
                />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-6 flex-wrap h-auto">
                    <TabsTrigger value="hero" className="gap-2">
                        <Sparkles size={16}/> قصص الأبطال
                    </TabsTrigger>
                    <TabsTrigger value="library" className="gap-2">
                        <Library size={16}/> المكتبة العامة
                    </TabsTrigger>
                    <TabsTrigger value="addons" className="gap-2">
                        <Puzzle size={16}/> الإضافات
                    </TabsTrigger>
                    <TabsTrigger value="subscription" className="gap-2">
                        <Box size={16}/> الاشتراكات
                    </TabsTrigger>
                    <TabsTrigger value="pending" className="gap-2 relative">
                        <Clock size={16} className={pendingCount > 0 ? "text-orange-500" : ""}/> 
                        طلبات النشر
                        {pendingCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full animate-pulse">
                                {pendingCount}
                            </span>
                        )}
                    </TabsTrigger>
                </TabsList>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            {activeTab === 'hero' && <><Sparkles className="text-pink-500" /> قائمة قصص "أنت البطل"</>}
                            {activeTab === 'library' && <><BookHeart className="text-blue-500" /> قائمة كتب المكتبة</>}
                            {activeTab === 'addons' && <><Puzzle className="text-yellow-500" /> قائمة المنتجات الإضافية</>}
                            {activeTab === 'subscription' && <><Box className="text-purple-500" /> إدارة صناديق الاشتراك</>}
                            {activeTab === 'pending' && <><Clock className="text-orange-500" /> منتجات بانتظار الموافقة</>}
                        </CardTitle>
                        <CardDescription>
                            {activeTab === 'hero' && "القصص التي يتم تخصيص محتواها وصورها بالكامل للطفل."}
                            {activeTab === 'library' && "الكتب الجاهزة التي يتم تخصيص غلافها فقط باسم الطفل وصورته."}
                            {activeTab === 'addons' && "المنتجات التي تظهر في سلة الشراء كاقتراحات إضافية."}
                            {activeTab === 'pending' && "كتب أضافها الناشرون وتحتاج لمراجعة وموافقة قبل النشر."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <SortableTableHead<PersonalizedProduct> sortKey="title" label="المنتج" sortConfig={sortConfig} onSort={handleSort} />
                                        <TableHead>الناشر</TableHead>
                                        <SortableTableHead<PersonalizedProduct> sortKey="price_printed" label="الأسعار (مطبوع/إلكتروني)" sortConfig={sortConfig} onSort={handleSort} />
                                        <SortableTableHead<PersonalizedProduct> sortKey="sort_order" label="الترتيب" sortConfig={sortConfig} onSort={handleSort} />
                                        <TableHead className="text-center w-24">الحالة</TableHead>
                                        <TableHead className="text-center"><Star size={16} className="mx-auto" /></TableHead>
                                        <TableHead>إجراءات</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredProducts.length > 0 ? (
                                        filteredProducts.map(product => (
                                            <TableRow key={product.id}>
                                                <TableCell className="flex items-center gap-4 min-w-[250px]">
                                                    <div className="w-12 h-12 flex-shrink-0 rounded-md overflow-hidden bg-muted border">
                                                        <Image src={product.image_url || ''} alt={product.title} className="w-full h-full" objectFit="contain" />
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold block text-base">{product.title}</span>
                                                        <span className="text-xs text-muted-foreground font-mono">{product.key}</span>
                                                    </div>
                                                </TableCell>
                                                
                                                <TableCell className="text-sm">
                                                    {product.publisher?.name || 'المنصة'}
                                                </TableCell>
                                                
                                                <TableCell className="font-mono text-sm">
                                                    {product.key === 'subscription_box' ? (
                                                        <span className="font-sans font-semibold text-primary">باقات متعددة</span>
                                                    ) : (
                                                        `${product.price_printed ? formatCurrency(product.price_printed) : '-'} / ${product.price_electronic ? formatCurrency(product.price_electronic) : '-'}`
                                                    )}
                                                </TableCell>
                                                <TableCell>{product.sort_order}</TableCell>

                                                <TableCell className="text-center">
                                                    {product.is_active !== false ? (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">نشط</span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">مخفي</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center">{product.is_featured ? <Check className="text-green-500 mx-auto" size={18} /> : <span className="text-gray-300">-</span>}</TableCell>
                                                <TableCell className="flex items-center gap-1">
                                                    {activeTab === 'pending' ? (
                                                        <>
                                                            <Button onClick={() => approveProduct.mutate({ productId: product.id, status: 'approved' })} variant="success" size="sm" title="موافقة ونشر">
                                                                <CheckCircle size={16} className="mr-1"/> نشر
                                                            </Button>
                                                            <Button onClick={() => approveProduct.mutate({ productId: product.id, status: 'rejected' })} variant="destructive" size="sm" title="رفض">
                                                                <XCircle size={16} />
                                                            </Button>
                                                            <Button onClick={() => navigate(`/personalized-products/${product.id}`)} variant="ghost" size="icon" title="معاينة"><Edit size={20} /></Button>
                                                        </>
                                                    ) : product.key === 'subscription_box' ? (
                                                        <>
                                                            <Button onClick={() => navigate(`/subscription-box`)} variant="ghost" size="icon" title="إدارة الصندوق والصورة" className="text-primary hover:bg-primary/10">
                                                                <Settings size={20} />
                                                            </Button>
                                                            <Button disabled variant="ghost" size="icon" className="opacity-30 cursor-not-allowed" title="لا يمكن حذف المنتج الأساسي"><Trash2 size={20} /></Button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Button onClick={() => navigate(`/personalized-products/${product.id}`)} variant="ghost" size="icon" title="تعديل"><Edit size={20} /></Button>
                                                            <Button onClick={() => handleDeleteProduct(product.id)} variant="ghost" size="icon" className="text-destructive" title="حذف"><Trash2 size={20} /></Button>
                                                        </>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={activeTab === 'pending' ? 7 : 6} className="text-center py-12 text-muted-foreground">
                                                لا توجد منتجات في هذا القسم.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </Tabs>
        </div>
    );
};

export default AdminPersonalizedProductsPage;
