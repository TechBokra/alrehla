
import React, { useState, useEffect } from 'react';
import { Save, Image as ImageIcon, DollarSign, Shield, Mail, Layout, Database, RefreshCw, AlertTriangle, PenTool, Library, GitMerge, Loader2 } from 'lucide-react';
import { useProduct, SiteBranding } from '../../contexts/ProductContext';
import { useAdminSocialLinks, useAdminPricingSettings, useAdminCommunicationSettings, useAdminMaintenanceSettings, useAdminLibraryPricingSettings } from '../../hooks/queries/admin/useAdminSettingsQuery';
import { useAdminSiteContent } from '../../hooks/queries/admin/useAdminContentQuery';
import { useSettingsMutations } from '../../hooks/mutations/useSettingsMutations';
import { useContentMutations } from '../../hooks/mutations/useContentMutations';
import PageLoader from '../../components/ui/PageLoader';
import { Button } from '../../components/ui/Button';
import FormField from '../../components/ui/FormField';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs';
import PermissionsManager from '../../components/admin/PermissionsManager';
import ImageUploadField from '../../components/admin/ui/ImageUploadField';
import { settingsService } from '../../services/settingsService';
import { userService } from '../../services/userService';
import { useToast } from '../../contexts/ToastContext';
import type { SocialLinks, PricingSettings, MaintenanceSettings, LibraryPricingSettings } from '../../lib/database.types';
import { Checkbox } from '../../components/ui/Checkbox';
import { cloudinaryService } from '../../services/cloudinaryService';

const AdminSettingsPage: React.FC = () => {
    const { siteBranding: initialBranding, setSiteBranding, loading: brandingLoading } = useProduct();
    const [branding, setBranding] = useState<Partial<SiteBranding>>({});
    const [isUploading, setIsUploading] = useState(false);
    const [deletedPublicIds, setDeletedPublicIds] = useState<string[]>([]);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            const hasUnsavedFiles = Object.values(branding).some(val => (val as any) instanceof File);
            if (hasUnsavedFiles) {
                e.preventDefault();
                e.returnValue = 'لديك تعديلات غير محفوظة في الهوية البصرية. هل أنت متأكد من المغادرة؟';
                return e.returnValue;
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [branding]);

    const { data: siteContent, isLoading: contentLoading } = useAdminSiteContent();
    const { updateSiteContent } = useContentMutations();

    const { data: commsData, isLoading: commsLoading } = useAdminCommunicationSettings();
    const [commSettings, setCommSettings] = useState({ support_email: '', join_us_email: '', whatsapp_number: '', whatsapp_default_message: '', instapay_url: '', instapay_qr_url: '', instapay_number: '' });
    
    const { data: socialLinksData, isLoading: socialsLoading } = useAdminSocialLinks();
    // Initialize with ID to satisfy TS type
    const [socials, setSocials] = useState<SocialLinks>({ id: 1, facebook_url: '', twitter_url: '', instagram_url: '' });
    
    const { data: pricingSettingsData, isLoading: pricingLoading } = useAdminPricingSettings();
    const { data: libraryPricingData, isLoading: libPricingLoading } = useAdminLibraryPricingSettings();
    const { data: maintenanceData, isLoading: maintenanceLoading } = useAdminMaintenanceSettings();
    
    const { updateSocialLinks, updateCommunicationSettings, updatePricingSettings, updateMaintenanceSettings, updateLibraryPricingSettings } = useSettingsMutations();
    
    // Initialize with ID to satisfy TS type
    const [pricing, setPricing] = useState<PricingSettings>({ id: 1, company_percentage: 1.2, fixed_fee: 50 });
    const [libraryPricing, setLibraryPricing] = useState<LibraryPricingSettings>({ id: 1, company_percentage: 1.3, fixed_fee: 30 });
    const [maintenance, setMaintenance] = useState<MaintenanceSettings>({ isActive: false, message: '' });
    
    const [isSeeding, setIsSeeding] = useState(false);
    const [isMerging, setIsMerging] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        if (initialBranding) setBranding(initialBranding);
    }, [initialBranding]);

    useEffect(() => {
        if (commsData) setCommSettings(commsData as any);
    }, [commsData]);

    useEffect(() => {
        if (socialLinksData) setSocials(socialLinksData as SocialLinks);
    }, [socialLinksData]);
    
    useEffect(() => {
        if (pricingSettingsData) setPricing(pricingSettingsData as PricingSettings);
    }, [pricingSettingsData]);

    useEffect(() => {
        if (libraryPricingData) setLibraryPricing(libraryPricingData as LibraryPricingSettings);
    }, [libraryPricingData]);

    useEffect(() => {
        if (maintenanceData) setMaintenance(maintenanceData as MaintenanceSettings);
    }, [maintenanceData]);


    const handleBrandingChange = (fieldKey: string, value: any) => {
        const oldValue = branding[fieldKey as keyof SiteBranding] || (initialBranding && (initialBranding as any)[fieldKey]);
        if (oldValue && typeof oldValue === 'string' && value !== oldValue) {
            const publicId = cloudinaryService.getPublicIdFromUrl(oldValue);
            if (publicId) {
                setDeletedPublicIds(prev => {
                    if (!prev.includes(publicId)) {
                        return [...prev, publicId];
                    }
                    return prev;
                });
            }
        }
        setBranding(prev => ({ ...prev, [fieldKey]: value }));
    };

    const handleImagesSubmit = async () => {
        setIsUploading(true);
        try {
            const finalBranding: any = { ...branding };
            
            // Upload any selected File objects to Cloudinary
            for (const key of Object.keys(finalBranding)) {
                const val = finalBranding[key];
                if (val instanceof File) {
                    const asset = await cloudinaryService.uploadImageWithCompression(val, 'branding');
                    finalBranding[key] = asset;
                }
            }

            await setSiteBranding(finalBranding);
            
            // Clean up deleted assets on successful save
            if (deletedPublicIds.length > 0) {
                await Promise.all(deletedPublicIds.map(id => cloudinaryService.deleteAsset(id)));
                setDeletedPublicIds([]);
            }
            
            addToast('تم تحديث الهوية البصرية بنجاح.', 'success');
        } catch (error: any) {
            console.error("Failed to upload/save branding images", error);
            addToast(`فشل حفظ الصور: ${error.message}`, 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const handleCommunicationSubmit = async () => {
        await updateCommunicationSettings.mutateAsync(commSettings);
        await updateSocialLinks.mutateAsync(socials);
    };
    
    const handlePricingSubmit = async () => {
        await updatePricingSettings.mutateAsync(pricing);
    };

    const handleLibraryPricingSubmit = async () => {
        await updateLibraryPricingSettings.mutateAsync(libraryPricing);
    };

    const handleMaintenanceSubmit = async () => {
        await updateMaintenanceSettings.mutateAsync(maintenance);
    }

    const handleSeedDatabase = async () => {
        if (!window.confirm("تحذير: هذا الإجراء سيقوم بإعادة تعيين كافة نصوص الموقع وإعداداته إلى القيم الافتراضية (البيانات الوهمية). هل أنت متأكد؟")) return;
        
        setIsSeeding(true);
        try {
            await settingsService.initializeDefaults();
            addToast('تمت استعادة البيانات الافتراضية بنجاح.', 'success');
            setTimeout(() => window.location.reload(), 1500); // Reload to reflect changes
        } catch (error: any) {
            addToast(`فشل العملية: ${error.message}`, 'error');
        } finally {
            setIsSeeding(false);
        }
    };
    
    const handleMergeDuplicates = async () => {
        if (!window.confirm("سيقوم هذا الإجراء بفحص جميع ملفات الأطفال، ودمج الملفات التي تحمل نفس الاسم وتتبع لنفس الأب في ملف واحد، مع نقل كافة الطلبات والحجوزات إليه. هل أنت متأكد من المتابعة؟")) return;
        
        setIsMerging(true);
        try {
            const result = await userService.mergeDuplicateChildren();
            addToast(`تمت العملية بنجاح! تم دمج ${result.mergedCount} مجموعة، وحذف ${result.deletedCount} ملف مكرر.`, 'success');
        } catch (error: any) {
            addToast(`فشل الدمج: ${error.message}`, 'error');
        } finally {
            setIsMerging(false);
        }
    };

    const isLoading = brandingLoading || socialsLoading || pricingLoading || commsLoading || contentLoading || maintenanceLoading || libPricingLoading;
    if (isLoading) return <PageLoader />;

    return (
        <div className="animate-fadeIn space-y-8 pb-20">
            <h1 className="text-3xl font-extrabold text-foreground">الإعدادات العامة</h1>
            
            <Tabs defaultValue="branding">
                <TabsList className="mb-8 flex-wrap h-auto">
                    <TabsTrigger value="branding"><ImageIcon className="ml-2 w-4 h-4" /> هوية الموقع</TabsTrigger>
                    <TabsTrigger value="communication"><Mail className="ml-2 w-4 h-4" /> التواصل</TabsTrigger>
                    <TabsTrigger value="pricing"><DollarSign className="ml-2 w-4 h-4" /> ماليات التدريب</TabsTrigger>
                    <TabsTrigger value="library_pricing"><Library className="ml-2 w-4 h-4" /> ماليات المكتبة</TabsTrigger>
                    <TabsTrigger value="permissions"><Shield className="ml-2 w-4 h-4" /> الصلاحيات</TabsTrigger>
                    <TabsTrigger value="maintenance"><PenTool className="ml-2 w-4 h-4" /> تنبيهات الموقع</TabsTrigger>
                    <TabsTrigger value="data"><Database className="ml-2 w-4 h-4" /> البيانات</TabsTrigger>
                </TabsList>

                <TabsContent value="branding" className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>الشعار والصورة الرئيسية</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ImageUploadField label="شعار المنصة (Logo)" fieldKey="logoUrl" currentUrl={branding.logoUrl} onUrlChange={handleBrandingChange} />
                            <ImageUploadField label="صورة الهيرو (الصفحة الرئيسية)" fieldKey="heroImageUrl" currentUrl={branding.heroImageUrl} onUrlChange={handleBrandingChange} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>صور بطاقات الأقسام (الصفحة الرئيسية)</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <ImageUploadField label="بطاقة إنها لك" fieldKey="enhaLakPortalImageUrl" currentUrl={branding.enhaLakPortalImageUrl} onUrlChange={handleBrandingChange} />
                            <ImageUploadField label="بطاقة بداية الرحلة" fieldKey="creativeWritingPortalImageUrl" currentUrl={branding.creativeWritingPortalImageUrl} onUrlChange={handleBrandingChange} />
                            <ImageUploadField label="بطاقة من نحن" fieldKey="aboutPortalImageUrl" currentUrl={branding.aboutPortalImageUrl} onUrlChange={handleBrandingChange} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>صور الصفحات الداخلية</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ImageUploadField label="هيرو صفحة من نحن" fieldKey="aboutHeroImageUrl" currentUrl={branding.aboutHeroImageUrl} onUrlChange={handleBrandingChange} />
                            <ImageUploadField label="صورة صفحة انضم إلينا" fieldKey="joinUsImageUrl" currentUrl={branding.joinUsImageUrl} onUrlChange={handleBrandingChange} />
                        </CardContent>
                    </Card>

                    <div className="flex justify-end sticky bottom-6 z-10">
                        <Button onClick={handleImagesSubmit} loading={isUploading} icon={<Save />} className="shadow-lg" size="lg">حفظ الهوية البصرية</Button>
                    </div>
                </TabsContent>

                <TabsContent value="communication" className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>روابط التواصل الاجتماعي</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <FormField label="فيسبوك" htmlFor="fb"><Input id="fb" value={socials.facebook_url} onChange={(e) => setSocials({...socials, facebook_url: e.target.value})} /></FormField>
                            <FormField label="تويتر" htmlFor="tw"><Input id="tw" value={socials.twitter_url} onChange={(e) => setSocials({...socials, twitter_url: e.target.value})} /></FormField>
                            <FormField label="انستجرام" htmlFor="ig"><Input id="ig" value={socials.instagram_url} onChange={(e) => setSocials({...socials, instagram_url: e.target.value})} /></FormField>
                        </CardContent>
                    </Card>
                    <div className="flex justify-end"><Button onClick={handleCommunicationSubmit} icon={<Save />}>حفظ التواصل</Button></div>
                </TabsContent>

                <TabsContent value="pricing" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>هيكل تسعير (بداية الرحلة)</CardTitle>
                            <CardDescription>هذه الإعدادات تحدد كيف يتم حساب السعر النهائي لخدمات وباقات المدربين.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField label="نسبة المنصة (مُعامل الضرب)" htmlFor="company_percentage">
                                    <Input id="company_percentage" type="number" step="0.1" value={pricing.company_percentage} onChange={(e) => setPricing({...pricing, company_percentage: parseFloat(e.target.value)})} />
                                    <p className="text-xs text-muted-foreground mt-1">مثال: 1.2 تعني زيادة 20% على سعر المدرب.</p>
                                </FormField>
                                <FormField label="الرسوم الإدارية الثابتة (ج.م)" htmlFor="fixed_fee">
                                    <Input id="fixed_fee" type="number" value={pricing.fixed_fee} onChange={(e) => setPricing({...pricing, fixed_fee: parseFloat(e.target.value)})} />
                                    <p className="text-xs text-muted-foreground mt-1">تضاف بعد احتساب النسبة.</p>
                                </FormField>
                            </div>
                            
                            <div className="p-4 bg-blue-50 rounded-lg border border-dashed border-blue-200">
                                <p className="text-sm font-bold text-blue-800 mb-2">معاينة المعادلة الحالية:</p>
                                <div className="text-lg font-mono text-center bg-white p-3 rounded border">
                                    السعر النهائي = (سعر المدرب * {pricing.company_percentage}) + {pricing.fixed_fee} ج.م
                                </div>
                            </div>
                            
                            <div className="flex justify-end"><Button onClick={handlePricingSubmit} icon={<Save />}>حفظ إعدادات التدريب</Button></div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="library_pricing" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>هيكل تسعير (المكتبة)</CardTitle>
                            <CardDescription>هذه الإعدادات تحدد كيف يتم حساب السعر النهائي للكتب والمنتجات المضافة بواسطة دور النشر.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField label="نسبة المنصة (مُعامل الضرب)" htmlFor="lib_company_percentage">
                                    <Input id="lib_company_percentage" type="number" step="0.1" value={libraryPricing.company_percentage} onChange={(e) => setLibraryPricing({...libraryPricing, company_percentage: parseFloat(e.target.value)})} />
                                    <p className="text-xs text-muted-foreground mt-1">مثال: 1.3 تعني زيادة 30% على صافي سعر دار النشر.</p>
                                </FormField>
                                <FormField label="الرسوم الثابتة لكل كتاب (ج.م)" htmlFor="lib_fixed_fee">
                                    <Input id="lib_fixed_fee" type="number" value={libraryPricing.fixed_fee} onChange={(e) => setLibraryPricing({...libraryPricing, fixed_fee: parseFloat(e.target.value)})} />
                                    <p className="text-xs text-muted-foreground mt-1">تغطي تكاليف المعالجة والتشغيل.</p>
                                </FormField>
                            </div>
                            
                            <div className="p-4 bg-purple-50 rounded-lg border border-dashed border-purple-200">
                                <p className="text-sm font-bold text-purple-800 mb-2">معاينة معادلة المكتبة:</p>
                                <div className="text-lg font-mono text-center bg-white p-3 rounded border">
                                    سعر العميل = (صافي الناشر * {libraryPricing.company_percentage}) + {libraryPricing.fixed_fee} ج.م
                                </div>
                            </div>
                            
                            <div className="flex justify-end"><Button onClick={handleLibraryPricingSubmit} icon={<Save />}>حفظ إعدادات المكتبة</Button></div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="permissions">
                    <PermissionsManager />
                </TabsContent>
                
                <TabsContent value="maintenance" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>شريط التنبيهات العلوي</CardTitle>
                            <CardDescription>عرض شريط ثابت في أعلى الموقع لتنبيه الزوار بوجود صيانة أو تطوير.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center gap-2">
                                <Checkbox 
                                    id="maintenance-active"
                                    checked={maintenance.isActive}
                                    onCheckedChange={(checked) => setMaintenance(prev => ({ ...prev, isActive: !!checked }))}
                                />
                                <label htmlFor="maintenance-active" className="text-sm font-medium">تفعيل الشريط</label>
                            </div>
                            <FormField label="نص الرسالة" htmlFor="maintenance-msg">
                                <Input 
                                    id="maintenance-msg" 
                                    value={maintenance.message} 
                                    onChange={e => setMaintenance(prev => ({ ...prev, message: e.target.value }))}
                                    placeholder="مثال: الموقع قيد التطوير حالياً..."
                                />
                            </FormField>
                            <div className="p-3 bg-yellow-400 text-black text-center font-bold text-sm rounded">
                                معاينة: {maintenance.message || 'الموقع قيد التطوير'}
                            </div>
                            <div className="flex justify-end">
                                <Button onClick={handleMaintenanceSubmit} loading={updateMaintenanceSettings.isPending} icon={<Save />}>
                                    حفظ الإعدادات
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="data" className="space-y-6">
                     <Card className="border-t-4 border-yellow-400">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-yellow-700">
                                <Database /> صيانة البيانات
                            </CardTitle>
                            <CardDescription>
                                أدوات إصلاح وتنظيف قاعدة البيانات.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                             {/* أداة دمج التكرارات */}
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <GitMerge className="text-blue-600 mt-1" />
                                    <div>
                                        <p className="font-bold text-blue-900 text-sm">دمج ملفات الأطفال المكررة</p>
                                        <p className="text-xs text-blue-700 mt-1">يصلح مشكلة تكرار ملف الطفل عند الطلب المتكرر. يقوم بدمج الملفات المتشابهة ونقل سجلاتها لملف واحد.</p>
                                    </div>
                                </div>
                                <Button onClick={handleMergeDuplicates} loading={isMerging} variant="outline" className="border-blue-300 text-blue-800 hover:bg-blue-100 whitespace-nowrap">
                                    فحص ودمج التكرارات
                                </Button>
                            </div>

                            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="text-yellow-600 mt-1" />
                                    <div>
                                        <p className="font-bold text-yellow-900 text-sm">التهيئة الأولية (Seed)</p>
                                        <p className="text-xs text-yellow-700 mt-1">إعادة تعيين المحتوى والإعدادات للقيم الافتراضية. (تحذير: يحذف التعديلات الحالية)</p>
                                    </div>
                                </div>
                                <Button onClick={handleSeedDatabase} loading={isSeeding} variant="outline" className="border-yellow-300 text-yellow-800 hover:bg-yellow-100 whitespace-nowrap" icon={<RefreshCw />}>
                                    استعادة المحتوى الافتراضي
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default AdminSettingsPage;
