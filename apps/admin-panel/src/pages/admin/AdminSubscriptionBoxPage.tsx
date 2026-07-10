
import React, { useState, useEffect, useMemo } from 'react';
import { Star, FileText, Package, Plus, Edit, Trash2, Save, ImageIcon, ExternalLink, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdminPersonalizedProducts, useAdminSubscriptionPlans } from '../../hooks/queries/admin/useAdminEnhaLakQuery';
import { useAdminSiteContent } from '../../hooks/queries/admin/useAdminContentQuery';
import { useSubscriptionMutations } from '../../hooks/mutations/useSubscriptionMutations';
import { useContentMutations } from '../../hooks/mutations/useContentMutations';
import { useProductMutations } from '../../hooks/mutations/useProductMutations';
import PageLoader from '../../components/ui/PageLoader';
import { SubscriptionPlanModal } from '../../components/admin/SubscriptionPlanModal';
import { Button } from '../../components/ui/Button';
import FormField from '../../components/ui/FormField';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import type { SubscriptionPlan, SiteContent } from '../../lib/database.types';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import ImageUploadField from '../../components/admin/ui/ImageUploadField';
import { cloudinaryService } from '../../services/cloudinaryService';

const AdminSubscriptionBoxPage: React.FC = () => {
    const navigate = useNavigate();
    
    // Queries
    const { data: rawPlans = [], isLoading: plansLoading } = useAdminSubscriptionPlans();
    const { data: siteContentData, isLoading: contentLoading } = useAdminSiteContent();
    const { data: products = [] } = useAdminPersonalizedProducts();
    
    // Mutations
    const { createSubscriptionPlan, updateSubscriptionPlan, deleteSubscriptionPlan } = useSubscriptionMutations();
    const { updateSiteContent } = useContentMutations();
    const { updatePersonalizedProduct } = useProductMutations();

    // State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [planToEdit, setPlanToEdit] = useState<SubscriptionPlan | null>(null);
    const [content, setContent] = useState<SiteContent['enhaLakPage']['subscription'] | null>(null);
    const [boxImage, setBoxImage] = useState<any>('');
    const [isUploading, setIsUploading] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: keyof SubscriptionPlan; direction: 'asc' | 'desc' } | null>({ key: 'price', direction: 'asc' });

    // Find the actual product record for the subscription box
    const boxProduct = useMemo(() => products.find(p => p.key === 'subscription_box'), [products]);

    const plans = useMemo(() => {
        let sortableItems = [...rawPlans];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
                if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [rawPlans, sortConfig]);

    const isLoading = plansLoading || contentLoading;

    useEffect(() => {
        if (siteContentData) {
            setContent(JSON.parse(JSON.stringify(siteContentData.enhaLakPage.subscription)));
        }
        if (boxProduct) {
            setBoxImage(boxProduct.image_url || '');
        }
    }, [siteContentData, boxProduct]);

    const handleOpenModal = (plan: SubscriptionPlan | null) => {
        setPlanToEdit(plan);
        setIsModalOpen(true);
    };

    const handleSavePlan = async (payload: any) => {
        try {
            if (payload.id) {
                await updateSubscriptionPlan.mutateAsync(payload);
            } else {
                await createSubscriptionPlan.mutateAsync(payload);
            }
            setIsModalOpen(false);
        } catch (e) { /* Error handled in hook */ }
    };
    
    const handleBoxImageUpdate = (key: string, value: any) => {
        setBoxImage(value);
    };

    const handleSaveBoxImage = async () => {
        if (!boxProduct || !(boxImage instanceof File)) return;
        setIsUploading(true);
        try {
            const asset = await cloudinaryService.uploadImageWithCompression(boxImage, 'products');
            const newUrl = JSON.stringify(asset);
            
            await updatePersonalizedProduct.mutateAsync({
                ...boxProduct,
                image_url: newUrl
            });

            // Clean up old asset on successful replacement
            if (boxProduct.image_url) {
                const publicId = cloudinaryService.getPublicIdFromUrl(boxProduct.image_url);
                if (publicId) {
                    await cloudinaryService.deleteAsset(publicId);
                }
            }

            setBoxImage(newUrl);
        } catch (e) {
            console.error("Failed to save box image", e);
        } finally {
            setIsUploading(false);
        }
    };

    const handleContentSave = async () => {
        if (siteContentData && content) {
            const newSiteContent = JSON.parse(JSON.stringify(siteContentData));
            newSiteContent.enhaLakPage.subscription = content;
            await updateSiteContent.mutateAsync(newSiteContent);
        }
    };

    if (isLoading || !content) return <PageLoader />;

    return (
        <>
            <SubscriptionPlanModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSavePlan}
                isSaving={updateSubscriptionPlan.isPending}
                planToEdit={planToEdit}
            />
            <div className="animate-fadeIn space-y-8">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-extrabold text-foreground">إدارة صندوق الرحلة الشهري</h1>
                </div>
                
                {boxProduct && (
                     <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <Settings className="text-blue-600" />
                                <div>
                                    <h3 className="font-bold text-blue-900">إدارة حقول التخصيص</h3>
                                    <p className="text-sm text-blue-700">تحكم في الأسئلة والحقول التي تظهر للعميل عند الاشتراك (مثل: اهتمامات الطفل، اسم العائلة، الصور المطلوبة).</p>
                                </div>
                            </div>
                            <Button 
                                onClick={() => navigate(`/personalized-products/${boxProduct.id}`)} 
                                variant="outline" 
                                className="bg-white border-blue-300 text-blue-700 hover:bg-blue-50"
                                icon={<ExternalLink size={16} />}
                            >
                                تعديل حقول المنتج
                            </Button>
                        </CardContent>
                    </Card>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText /> محتوى صفحة الاشتراك
                                </CardTitle>
                                <CardDescription>النصوص التعريفية التي تظهر للعملاء في صفحة الصندوق.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField label="العنوان الرئيسي" htmlFor="heroTitle">
                                    <Input id="heroTitle" value={content.heroTitle} onChange={e => setContent({...content, heroTitle: e.target.value})} />
                                </FormField>
                                <FormField label="النص التعريفي" htmlFor="heroSubtitle">
                                    <Textarea id="heroSubtitle" value={content.heroSubtitle} onChange={e => setContent({...content, heroSubtitle: e.target.value})} rows={3}/>
                                </FormField>
                                <FormField label="ميزات الصندوق (كل ميزة في سطر)" htmlFor="features">
                                    <Textarea id="features" value={(content.features || []).join('\n')} onChange={e => setContent({...content, features: e.target.value.split('\n')})} rows={4}/>
                                </FormField>
                                <div className="flex justify-end">
                                    <Button onClick={handleContentSave} loading={updateSiteContent.isPending} icon={<Save />}>حفظ المحتوى النصي</Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                     <span className="flex items-center gap-2"><Package /> باقات الاشتراك</span>
                                    <Button onClick={() => handleOpenModal(null)} icon={<Plus size={18} />} size="sm">
                                        إضافة باقة
                                    </Button>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                 <div className="overflow-x-auto">
                                    <Table>
                                       <TableHeader>
                                           <TableRow>
                                                <TableHead>الباقة</TableHead>
                                                <TableHead>المدة</TableHead>
                                                <TableHead>السعر الإجمالي</TableHead>
                                                <TableHead>السعر الشهري</TableHead>
                                                <TableHead>إجراءات</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {plans.map((plan: SubscriptionPlan) => (
                                                <TableRow key={plan.id}>
                                                    <TableCell className="font-semibold">{plan.name} {plan.is_best_value && <span className="text-xs text-primary">(الأفضل قيمة)</span>}</TableCell>
                                                    <TableCell>{plan.duration_months} أشهر</TableCell>
                                                    <TableCell className="font-bold">{plan.price} ج.م</TableCell>
                                                    <TableCell>{plan.price_per_month} ج.م</TableCell>
                                                    <TableCell className="flex items-center gap-2">
                                                        <Button variant="ghost" size="icon" onClick={() => handleOpenModal(plan)}><Edit size={20} /></Button>
                                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteSubscriptionPlan.mutate({ planId: plan.id })}><Trash2 size={20} /></Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-1 space-y-8">
                        <Card className="border-t-4 border-t-primary">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <ImageIcon className="text-primary" /> صورة عرض الصندوق
                                </CardTitle>
                                <CardDescription>هذه هي الصورة التي تظهر في قائمة المنتجات، المتجر، والصفحة التعريفية.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ImageUploadField 
                                    label="تحميل صورة الصندوق"
                                    fieldKey="subscription_box_img"
                                    currentUrl={boxImage}
                                    onUrlChange={handleBoxImageUpdate}
                                    recommendedSize="800x800px"
                                />
                                {boxImage instanceof File && (
                                    <Button 
                                        onClick={handleSaveBoxImage} 
                                        loading={isUploading} 
                                        className="w-full mt-4 animate-fadeIn" 
                                        icon={<Save size={16} />}
                                    >
                                        حفظ صورة الصندوق
                                    </Button>
                                )}
                            </CardContent>
                        </Card>

                        <div className="p-4 bg-blue-50 text-blue-800 rounded-lg border border-blue-100 text-sm">
                            <p className="font-bold mb-2 flex items-center gap-2"><Star size={16}/> ملاحظة الفصل:</p>
                            <p>تغيير الصورة من هنا سيقوم بتحديثها تلقائياً في كل مكان يستخدم "صندوق الرحلة" كمثال للمنتج.</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AdminSubscriptionBoxPage;
