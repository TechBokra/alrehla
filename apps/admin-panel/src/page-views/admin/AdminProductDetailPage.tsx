
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAdminPersonalizedProducts } from '../../hooks/queries/admin/useAdminEnhaLakQuery';
import { useAdminLibraryPricingSettings } from '../../hooks/queries/admin/useAdminSettingsQuery';
import { useAllPublishers } from '../../hooks/queries/admin/useAdminUsersQuery';
import { useProductMutations } from '../../hooks/mutations/useProductMutations';
import { useAuth } from '../../contexts/AuthContext';
import PageLoader from '@alrehla/ui/page-loader';
import { Button } from '@alrehla/ui/button';
import FormField from '@alrehla/ui/form-field';
import { Input } from '@alrehla/ui/input';
import { Textarea } from '@alrehla/ui/textarea';
import { Select } from '@alrehla/ui/native-select';
import { ArrowLeft, Save, Gift, Settings, Type, Image as ImageIcon, Star, Eye, Calculator, Building2 } from 'lucide-react';
import type { PersonalizedProduct } from '../../lib/database.types';
import { v4 as uuidv4 } from 'uuid';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@alrehla/ui/card';
import { Checkbox } from '@alrehla/ui/checkbox';
import ImageUploadField from '../../components/admin/ui/ImageUploadField';
import DynamicListManager from '../../components/admin/DynamicListManager';
import { calculateLibraryProductPrice, calculatePublisherNet } from '../../utils/pricingCalculator';
import { cloudinaryService } from '../../services/cloudinaryService';

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

const AdminProductDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const searchParams = useSearchParams();
    const router = useRouter();
    const navigate = createNavigate(router);
    const { currentUser, permissions } = useAuth();
    
    const isNew = !id || id === 'new';
    const initialType = searchParams.get('type'); 
    
    const { data: allProducts = [], isLoading: productsLoading } = useAdminPersonalizedProducts();
    const { data: pricingConfig, isLoading: configLoading } = useAdminLibraryPricingSettings();
    const { data: publishers = [], isLoading: publishersLoading } = useAllPublishers();

    const { createPersonalizedProduct, updatePersonalizedProduct } = useProductMutations();
    const isSaving = createPersonalizedProduct.isPending || updatePersonalizedProduct.isPending;

    // UI State for electronic toggle
    const [hasElectronicOption, setHasElectronicOption] = useState(false);

    const [product, setProduct] = useState<Partial<PersonalizedProduct>>({
        title: '',
        key: '',
        product_type: permissions.isPublisher ? 'library_book' : 'hero_story',
        description: '',
        features: [],
        sort_order: 99,
        is_featured: false,
        is_addon: false,
        is_active: true, // Default to Active
        has_printed_version: true, // Default: Printed is primary
        price_printed: 0,
        price_electronic: 0,
        image_slots: [],
        text_fields: [],
        goal_config: 'predefined_and_custom',
        story_goals: [],
        component_keys: [],
        publisher_id: null,
    });
    const [initialImageUrl, setInitialImageUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if ((product.image_url as any) instanceof File) {
                e.preventDefault();
                e.returnValue = 'لديك تعديلات غير محفوظة في الصورة. هل أنت متأكد من المغادرة؟';
                return e.returnValue;
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [product.image_url]);

    const handleBack = (e: React.MouseEvent) => {
        e.preventDefault();
        if ((product.image_url as any) instanceof File) {
            if (!window.confirm('لديك تعديلات غير محفوظة في الصورة. هل تريد المغادرة وإلغاء التغييرات؟')) {
                return;
            }
        }
        navigate(permissions.isPublisher ? '/publisher-products' : '/personalized-products');
    };

    // State for NET prices (Publisher Input)
    const [netPricePrinted, setNetPricePrinted] = useState<string>('');
    const [netPriceElectronic, setNetPriceElectronic] = useState<string>('');

    useEffect(() => {
        if (!isNew && allProducts.length > 0) {
            const productToEdit = allProducts.find(p => p.id === parseInt(id!));
            if (productToEdit) {
                const displayType = productToEdit.is_addon ? 'addon' : (productToEdit.product_type || 'hero_story');
                setInitialImageUrl(productToEdit.image_url || null);
                setProduct({
                    ...productToEdit,
                    product_type: displayType,
                    is_active: productToEdit.is_active ?? true
                });
                
                // Set UI toggle based on data
                if (productToEdit.price_electronic && productToEdit.price_electronic > 0) {
                    setHasElectronicOption(true);
                }

                // Reverse Calculate Net Price for display if configured
                if (pricingConfig) {
                    const netP = calculatePublisherNet(productToEdit.price_printed || 0, pricingConfig);
                    const netE = calculatePublisherNet(productToEdit.price_electronic || 0, pricingConfig);
                    setNetPricePrinted(netP > 0 ? netP.toString() : '');
                    setNetPriceElectronic(netE > 0 ? netE.toString() : '');
                } else {
                     setNetPricePrinted(productToEdit.price_printed?.toString() || '');
                     setNetPriceElectronic(productToEdit.price_electronic?.toString() || '');
                }
            } else {
                navigate(permissions.isPublisher ? '/publisher-products' : '/personalized-products');
            }
        } else if (isNew) {
             // Defaults for Library Books (Publishers or Admin selected type)
             if (permissions.isPublisher || initialType === 'library_book') {
                setProduct(prev => ({
                    ...prev,
                    product_type: 'library_book',
                    is_addon: false,
                    goal_config: 'none',
                    // Enforce Mandatory Image Slots for Library Books
                    image_slots: [
                        { id: 'face_image', label: 'صورة وجه الطفل (إلزامي)', required: true },
                        { id: 'extra_image', label: 'صورة أخرى (اختياري)', required: false }
                    ],
                    text_fields: [],
                    has_printed_version: true 
                }));
             }
             // ... other defaults
             else if (initialType === 'subscription_box') {
                setProduct(prev => ({
                    ...prev,
                    title: 'صندوق الرحلة الشهري',
                    key: 'subscription_box',
                    product_type: 'subscription_box',
                    description: 'اشتراك شهري متجدد يحتوي على قصة مخصصة وأنشطة وهدايا.',
                    features: ['قصة مخصصة جديدة كل شهر', 'أنشطة تفاعلية وألعاب', 'هدية إضافية مختارة بعناية'],
                    goal_config: 'none',
                    image_slots: [{ id: 'child_photo_1', label: 'صورة وجه الطفل (إلزامي)', required: true }],
                    text_fields: [{ id: 'childTraits', label: 'اخبرنا عن بطل القصة*', placeholder: 'مثال: شجاع، يحب الديناصورات...', required: true, type: 'textarea' }],
                    has_printed_version: true,
                    sort_order: -1,
                }));
            } else if (initialType === 'addon') {
                 setProduct(prev => ({
                    ...prev,
                    product_type: 'addon',
                    is_addon: true,
                    goal_config: 'none',
                    sort_order: 50,
                    has_printed_version: true
                }));
            }
        }
    }, [id, isNew, allProducts, navigate, initialType, permissions.isPublisher, pricingConfig]);
    
    // Update final price when net price changes
    useEffect(() => {
        if (pricingConfig) {
            const finalP = calculateLibraryProductPrice(parseFloat(netPricePrinted), pricingConfig);
            // Only calc electronic if the option is enabled
            const finalE = hasElectronicOption ? calculateLibraryProductPrice(parseFloat(netPriceElectronic), pricingConfig) : 0;
            
            setProduct(prev => ({
                ...prev,
                price_printed: finalP,
                price_electronic: finalE
            }));
        } else {
             // Fallback
             setProduct(prev => ({
                ...prev,
                price_printed: parseFloat(netPricePrinted) || 0,
                price_electronic: hasElectronicOption ? (parseFloat(netPriceElectronic) || 0) : 0
            }));
        }
    }, [netPricePrinted, netPriceElectronic, pricingConfig, hasElectronicOption]);

    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === 'addon') {
            setProduct(prev => ({ ...prev, product_type: 'addon', is_addon: true, goal_config: 'none', image_slots: [] }));
        } else if (value === 'library_book') {
             setProduct(prev => ({ 
                 ...prev, 
                 product_type: 'library_book', 
                 is_addon: false, 
                 goal_config: 'none', 
                 has_printed_version: true,
                 // Set default slots when switching to library book
                 image_slots: [
                    { id: 'face_image', label: 'صورة وجه الطفل (إلزامي)', required: true },
                    { id: 'extra_image', label: 'صورة أخرى (اختياري)', required: false }
                 ]
             }));
        } else {
             // Hero Story
             setProduct(prev => ({ ...prev, product_type: value as any, is_addon: false, goal_config: prev.goal_config === 'none' ? 'predefined_and_custom' : prev.goal_config }));
        }
    };

    const handleSimpleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        const checked = (e.target as HTMLInputElement).checked;

        setProduct(prev => ({
            ...prev,
            [name]: isCheckbox ? checked : value
        }));
    };
    
    const handleDynamicListChange = (listKey: keyof PersonalizedProduct, index: number, field: string, value: any) => {
        setProduct(prev => {
            const list = [...(prev[listKey] as any[] || [])];
            list[index] = { ...list[index], [field]: value };
            return { ...prev, [listKey]: list };
        });
    };

    const handleAddItem = (listKey: keyof PersonalizedProduct) => {
        let newItem: any;
        if (listKey === 'image_slots') newItem = { id: `img_${uuidv4().slice(0,4)}`, label: '', required: false };
        else if (listKey === 'text_fields') newItem = { id: `txt_${uuidv4().slice(0,4)}`, label: '', placeholder: '', required: false, type: 'textarea' };
        else if (listKey === 'story_goals') newItem = { key: `goal_${uuidv4().slice(0,4)}`, title: '' };

        setProduct(prev => ({ ...prev, [listKey]: [...(prev[listKey] as any[] || []), newItem] }));
    };

    const handleRemoveItem = (listKey: keyof PersonalizedProduct, index: number) => {
        setProduct(prev => ({ ...prev, [listKey]: (prev[listKey] as any[] || []).filter((_, i) => i !== index) }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUploading(true);

        try {
            let uploadedImageUrl = product.image_url;
            let newFileUploaded = false;

            if ((product.image_url as any) instanceof File) {
                const asset = await cloudinaryService.uploadImageWithCompression(product.image_url as any, 'products');
                // Save the full asset object stringified to fit in TEXT column
                uploadedImageUrl = JSON.stringify(asset);
                newFileUploaded = true;
            }

            const payload: any = {
                ...product,
                image_url: uploadedImageUrl,
                is_addon: product.product_type === 'addon',
                has_printed_version: true, // Force Printed for library/publisher products
                price_printed: Number(product.price_printed),
                price_electronic: hasElectronicOption ? (Number(product.price_electronic) || null) : null,
            };

            // Ensure key exists
            if (isNew && !payload.key) {
                 payload.key = `prod_${uuidv4().slice(0,8)}`;
            }
            
            // Ensure Publisher ID is set correctly
            if (permissions.isPublisher && currentUser) {
                payload.publisher_id = currentUser.id;
            }

            if (isNew) await createPersonalizedProduct.mutateAsync(payload);
            else await updatePersonalizedProduct.mutateAsync(payload);

            // Clean up old asset on successful replacement
            if (initialImageUrl && newFileUploaded) {
                const publicId = cloudinaryService.getPublicIdFromUrl(initialImageUrl);
                if (publicId) {
                    await cloudinaryService.deleteAsset(publicId);
                }
            }
            
            navigate(permissions.isPublisher ? '/publisher-products' : '/personalized-products');
        } catch (error) {
            console.error("Failed to save product", error);
        } finally {
            setIsUploading(false);
        }
    };

    if ((productsLoading || configLoading || publishersLoading) && !isNew) return <PageLoader />;

    return (
         <div className="animate-fadeIn space-y-8">
            <div className="flex justify-between items-center">
                <div onClick={handleBack} className="inline-flex cursor-pointer items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-semibold">
                    <ArrowLeft size={16} /> العودة
                </div>
                <h1 className="text-2xl font-bold text-foreground">
                    {isNew ? 'كتاب جديد' : `تعديل: ${product.title}`}
                </h1>
            </div>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><Gift /> المعلومات الأساسية</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                               <FormField label="عنوان الكتاب / المنتج*" htmlFor="title">
                                    <Input id="title" name="title" value={product.title} onChange={handleSimpleChange} required />
                                </FormField>
                                {!permissions.isPublisher && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField label="نوع المنتج" htmlFor="product_type">
                                            <Select id="product_type" name="product_type" value={product.product_type} onChange={handleTypeChange}>
                                                <option value="hero_story">أنت البطل (تخصيص كامل)</option>
                                                <option value="library_book">كتاب مكتبة (غلاف فقط)</option>
                                                <option value="addon">منتج إضافي (إضافات إبداعية)</option>
                                                <option value="subscription_box">صندوق اشتراك</option>
                                            </Select>
                                        </FormField>
                                        <FormField label="دار النشر (المالك)" htmlFor="publisher_id">
                                            <Select id="publisher_id" name="publisher_id" value={product.publisher_id || ''} onChange={handleSimpleChange}>
                                                <option value="">(بدون ناشر - المنصة)</option>
                                                {publishers.map(pub => (
                                                    <option key={pub.id} value={pub.id}>{pub.name}</option>
                                                ))}
                                            </Select>
                                        </FormField>
                                    </div>
                                )}
                                {permissions.isPublisher && (
                                    <div className="bg-blue-50 text-blue-800 p-3 rounded-md text-sm flex items-center gap-2 border border-blue-200">
                                        <Building2 size={16}/> <span>دار النشر: <strong>{currentUser?.name}</strong></span>
                                    </div>
                                )}
                                <FormField label="الوصف" htmlFor="description">
                                    <Textarea id="description" name="description" value={product.description || ''} onChange={handleSimpleChange} rows={3} />
                                </FormField>
                                <ImageUploadField 
                                    label="صورة الغلاف" 
                                    fieldKey="image_url" 
                                    currentUrl={product.image_url || ''} 
                                    onUrlChange={(k, v) => setProduct(p => ({...p, [k]: v}))}
                                    recommendedSize="800x800px" 
                                />
                                <FormField label="الميزات (كل ميزة في سطر)" htmlFor="features">
                                    <Textarea id="features" value={(product.features || []).join('\n')} onChange={e => setProduct({...product, features: e.target.value.split('\n')})} rows={4} placeholder="مثال: طباعة فاخرة&#10;غلاف مقوى" />
                                </FormField>
                        </CardContent>
                    </Card>
                    
                    {/* Image Slots Configuration - Now editable/visible for library books */}
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><ImageIcon /> تخصيص الصور (للعميل)</CardTitle></CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">هذه هي الأماكن التي سيرفع فيها العميل صوره عند الشراء (مثل صورة الوجه للغلاف).</p>
                             <DynamicListManager 
                                items={product.image_slots || []}
                                onAdd={() => handleAddItem('image_slots')}
                                onRemove={(idx) => handleRemoveItem('image_slots', idx)}
                                onChange={(idx, key, val) => handleDynamicListChange('image_slots', idx, key, val)}
                                addButtonLabel="إضافة خانة صورة"
                                // Disable removing mandatory slots for Library Books to prevent user error, but allow adding more? 
                                // Actually, let's keep it flexible but pre-filled.
                                fields={[
                                    { key: 'label', placeholder: 'عنوان الصورة (مثال: صورة الوجه)', width: 'flex-grow' },
                                    { key: 'required', placeholder: 'إلزامي؟', type: 'checkbox', width: 'w-24' },
                                ]}
                            />
                        </CardContent>
                    </Card>

                    {/* Text Fields Customization */}
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><Type /> حقول التخصيص النصية</CardTitle></CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">أضف حقولاً ليقوم العميل بملئها عند الشراء (مثال: اسم الطفل للإهداء).</p>
                            <DynamicListManager 
                                items={product.text_fields || []}
                                onAdd={() => handleAddItem('text_fields')}
                                onRemove={(idx) => handleRemoveItem('text_fields', idx)}
                                onChange={(idx, key, val) => handleDynamicListChange('text_fields', idx, key, val)}
                                addButtonLabel="إضافة حقل نصي"
                                fields={[
                                    { key: 'label', placeholder: 'العنوان (مثال: اسم الطفل)' },
                                    { key: 'required', placeholder: 'إلزامي؟', type: 'checkbox', width: 'w-24' },
                                ]}
                            />
                        </CardContent>
                    </Card>

                    {/* Only Admins manage Goal Configs for complex stories */}
                    {!permissions.isPublisher && product.product_type !== 'library_book' && product.product_type !== 'addon' && (
                        <Card>
                            <CardHeader><CardTitle className="flex items-center gap-2"><Star /> الأهداف التربوية</CardTitle></CardHeader>
                            <CardContent>
                                <DynamicListManager 
                                    items={product.story_goals || []}
                                    onAdd={() => handleAddItem('story_goals')}
                                    onRemove={(idx) => handleRemoveItem('story_goals', idx)}
                                    onChange={(idx, key, val) => handleDynamicListChange('story_goals', idx, key, val)}
                                    addButtonLabel="إضافة هدف"
                                    disableAdd={product.goal_config !== 'predefined' && product.goal_config !== 'predefined_and_custom'}
                                    fields={[
                                        { key: 'key', placeholder: 'المعرف (key)' },
                                        { key: 'title', placeholder: 'عنوان الهدف (مثال: الصدق)' },
                                    ]}
                                />
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="lg:col-span-1 sticky top-24 space-y-6">
                    {/* التسعير الديناميكي للمكتبة */}
                    <Card className="border-t-4 border-green-500 shadow-sm">
                        <CardHeader className="bg-green-50 border-b border-green-100 pb-4">
                            <CardTitle className="flex items-center gap-2 text-green-800"><Calculator /> تسعير الكتاب</CardTitle>
                            <CardDescription>أدخل السعر الصافي الذي ترغب في الحصول عليه من المبيعات.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                             
                            {/* نسخة مطبوعة (Primary) */}
                            <div className="bg-white p-3 rounded-xl border space-y-2 shadow-sm">
                                <FormField label="صافي ربحك (نسخة مطبوعة)" htmlFor="netPricePrinted">
                                    <Input 
                                        type="number" 
                                        id="netPricePrinted" 
                                        value={netPricePrinted} 
                                        onChange={(e) => setNetPricePrinted(e.target.value)} 
                                        className="font-bold text-lg"
                                        placeholder="0"
                                    />
                                </FormField>
                                <div className="flex justify-between items-center bg-gray-50 p-2 rounded text-xs">
                                    <span className="text-gray-500">يظهر للعميل بـ:</span>
                                    <span className="font-black text-lg text-blue-600">{product.price_printed} ج.م</span>
                                </div>
                            </div>

                             {/* نسخة إلكترونية (Optional) */}
                            <div className={`p-3 rounded-xl border space-y-3 transition-colors ${hasElectronicOption ? 'bg-white shadow-sm' : 'bg-muted/30 border-dashed'}`}>
                                <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-gray-700">
                                    <Checkbox checked={hasElectronicOption} onCheckedChange={(checked) => setHasElectronicOption(!!checked)} />
                                    توفير نسخة إلكترونية (PDF)
                                </label>

                                {hasElectronicOption && (
                                    <>
                                        <FormField label="صافي ربحك (نسخة إلكترونية)" htmlFor="netPriceElectronic">
                                            <Input 
                                                type="number" 
                                                id="netPriceElectronic" 
                                                value={netPriceElectronic} 
                                                onChange={(e) => setNetPriceElectronic(e.target.value)} 
                                                className="font-bold text-lg"
                                                placeholder="0"
                                            />
                                        </FormField>
                                        <div className="flex justify-between items-center bg-gray-50 p-2 rounded text-xs">
                                            <span className="text-gray-500">يظهر للعميل بـ:</span>
                                            <span className="font-black text-lg text-blue-600">{product.price_electronic} ج.م</span>
                                        </div>
                                    </>
                                )}
                            </div>

                        </CardContent>
                    </Card>

                    <Card className="border-t-4 border-t-primary">
                            <CardHeader><CardTitle className="flex items-center gap-2"><Settings /> الإعدادات</CardTitle></CardHeader>
                            <CardContent className="space-y-6">
                            <label className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg cursor-pointer hover:bg-green-100 transition-colors">
                                <Checkbox checked={product.is_active} onCheckedChange={v => setProduct({...product, is_active: !!v})} />
                                <span className="text-sm font-bold text-green-800 flex items-center gap-2"><Eye size={16}/> عرض في المتجر</span>
                            </label>

                            {!permissions.isPublisher && (
                                <FormField label="المعرّف (Key)*" htmlFor="key">
                                    <Input id="key" name="key" value={product.key} onChange={handleSimpleChange} required disabled={!isNew} dir="ltr" />
                                </FormField>
                            )}

                            {!permissions.isPublisher && (
                                <FormField label="ترتيب العرض" htmlFor="sort_order">
                                    <Input type="number" id="sort_order" name="sort_order" value={product.sort_order || ''} onChange={handleSimpleChange} />
                                </FormField>
                            )}

                            <div className="space-y-3 pt-4 border-t">
                                {!permissions.isPublisher && (
                                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_featured" checked={product.is_featured} onChange={handleSimpleChange}/> منتج مميز</label>
                                )}
                            </div>
                            <Button type="submit" loading={isSaving || isUploading} size="lg" icon={<Save />} className="w-full">
                                {isSaving || isUploading ? 'جاري الحفظ...' : 'حفظ الكتاب'}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </form>
        </div>
    );
};

export default AdminProductDetailPage;
