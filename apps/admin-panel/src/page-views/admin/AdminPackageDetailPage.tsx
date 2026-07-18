
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Calculator, Info, ListChecks, Type, CheckSquare } from 'lucide-react';
import { useAdminCWSettings, useAdminPricingSettings } from '../../hooks/queries/admin/useAdminSettingsQuery';
import { useCreativeWritingSettingsMutations } from '../../hooks/mutations/useCreativeWritingSettingsMutations';
import PageLoader from '@alrehla/ui/page-loader';
import { Button } from '@alrehla/ui/button';
import FormField from '@alrehla/ui/form-field';
import { Input } from '@alrehla/ui/input';
import { Textarea } from '@alrehla/ui/textarea';
import { Select } from '@alrehla/ui/native-select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@alrehla/ui/card';
import { Checkbox } from '@alrehla/ui/checkbox';
import type { CreativeWritingPackage } from '../../lib/database.types';
import { IconMap } from '../../components/creative-writing/services/IconMap';
import { calculateCustomerPrice } from '../../utils/pricingCalculator';

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

const AdminPackageDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const navigate = createNavigate(router);
    const isNew = !id || id === 'new';

    const { data, isLoading: settingsLoading } = useAdminCWSettings();
    const { data: pricingConfig, isLoading: pricingLoading } = useAdminPricingSettings();
    const { createPackage, updatePackage } = useCreativeWritingSettingsMutations();
    
    // استخراج معايير المقارنة من البيانات العامة
    const comparisonItems = data?.comparisonItems || [];

    const [pkg, setPkg] = useState<Partial<CreativeWritingPackage>>({
        name: '',
        sessions: '',
        price: 0, // هذا يمثل السعر الأساسي/الصافي
        features: [],
        description: '',
        detailed_description: '',
        target_age: '',
        level: '',
        icon_name: 'Rocket',
        popular: false,
        comparison_values: {}, 
    });

    const [featuresString, setFeaturesString] = useState('');

    useEffect(() => {
        if (!isNew && data?.packages && id) {
            // Ensure ID comparison works (string vs number)
            const packageId = parseInt(id, 10);
            const foundPkg = data.packages.find(p => p.id === packageId);
            
            if (foundPkg) {
                // تأكد من وجود كائن للقيم حتى لو كان فارغاً في قاعدة البيانات
                setPkg({ ...foundPkg, comparison_values: foundPkg.comparison_values || {} });
                setFeaturesString(foundPkg.features.join('\n'));
            } else {
                // If package not found in loaded data, maybe redirect
                // navigate('/creative-writing-packages');
            }
        }
    }, [id, isNew, data]);

    // حساب تفاصيل السعر للعرض
    const pricingBreakdown = useMemo(() => {
        const basePrice = pkg.price || 0;
        if (!pricingConfig) return { customerPrice: basePrice, fees: 0, margin: 0 };

        const customerPrice = calculateCustomerPrice(basePrice, pricingConfig);
        const variableFee = (basePrice * (pricingConfig.company_percentage - 1)); // الجزء الزائد من النسبة
        const totalFees = customerPrice - basePrice;

        return {
            basePrice,
            customerPrice,
            totalFees,
            platformMarkup: ((pricingConfig.company_percentage - 1) * 100).toFixed(0),
            fixedFee: pricingConfig.fixed_fee
        };
    }, [pkg.price, pricingConfig]);

    // معالج تغيير قيم المقارنة
    const handleComparisonChange = (itemId: string, value: string | boolean) => {
        setPkg(prev => ({
            ...prev,
            comparison_values: {
                ...prev.comparison_values,
                [itemId]: value
            }
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...pkg,
            // Ensure ID is passed correctly for updates
            id: isNew ? undefined : parseInt(id!, 10), 
            features: featuresString.split('\n').filter(f => f.trim() !== ''),
        };
        
        try {
            if (isNew) {
                await createPackage.mutateAsync(payload);
            } else {
                await updatePackage.mutateAsync(payload);
            }
            navigate('/creative-writing-packages');
        } catch (error) {
            console.error("Save failed", error);
        }
    };

    if ((settingsLoading || pricingLoading) && !isNew) return <PageLoader />;

    return (
        <div className="animate-fadeIn space-y-8 pb-20">
            <Link href="/creative-writing-packages" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-semibold mb-4">
                <ArrowLeft size={16} /> العودة للقائمة
            </Link>
            
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-extrabold text-foreground">
                    {isNew ? 'إضافة باقة جديدة' : `تعديل الباقة: ${pkg.name}`}
                </h1>
                <Button type="submit" form="package-form" loading={createPackage.isPending || updatePackage.isPending} icon={<Save />}>حفظ</Button>
            </div>

            <form id="package-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader><CardTitle>بيانات الباقة الأساسية</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField label="اسم الباقة*" htmlFor="name">
                                    <Input id="name" name="name" value={pkg.name} onChange={e => setPkg({...pkg, name: e.target.value})} required placeholder="مثال: الباقة الأساسية" />
                                </FormField>
                                <FormField label="عدد الجلسات (نصي)*" htmlFor="sessions">
                                    <Input id="sessions" name="sessions" value={pkg.sessions} onChange={e => setPkg({...pkg, sessions: e.target.value})} required placeholder="مثال: 4 جلسات"/>
                                </FormField>
                            </div>
                            <FormField label="الوصف المختصر" htmlFor="description">
                                <Textarea id="description" name="description" value={pkg.description} onChange={e => setPkg({...pkg, description: e.target.value})} rows={3} />
                            </FormField>
                             <div className="bg-blue-50 p-3 rounded-lg flex gap-2 text-sm text-blue-800 border border-blue-100">
                                <Info className="shrink-0 mt-0.5" size={16} />
                                <p>هذا السعر هو سعر <strong>الباقة بالكامل</strong> وليس سعر الجلسة.</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-t-4 border-primary">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Calculator className="text-primary"/> تفاصيل التسعير (المعادلة)</CardTitle>
                            <CardDescription>
                                النظام يقوم بحساب السعر النهائي تلقائياً بناءً على إعدادات المنصة.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                <FormField label="السعر الأساسي / صافي المدرب (ج.م)" htmlFor="price">
                                    <Input 
                                        type="number" 
                                        id="price" 
                                        value={pkg.price} 
                                        onChange={e => setPkg({...pkg, price: parseFloat(e.target.value) || 0})} 
                                        className="font-bold text-lg"
                                        min="0"
                                    />
                                    <p className="text-[10px] text-muted-foreground mt-1">
                                        المبلغ الذي يحصل عليه المدرب (أو تكلفة الباقة قبل الهامش). أدخل 0 لجعلها مجانية.
                                    </p>
                                </FormField>
                                
                                <div className="p-5 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                                    <h4 className="font-bold text-gray-700 text-sm border-b pb-2">كيف سيظهر السعر للعميل؟</h4>
                                    
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>السعر الأساسي:</span>
                                        <span className="font-mono">{pricingBreakdown.basePrice} ج.م</span>
                                    </div>
                                    
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>+ نسبة المنصة ({pricingBreakdown.platformMarkup}%):</span>
                                        <span className="font-mono">
                                            {(pricingBreakdown.basePrice * (pricingConfig?.company_percentage ? pricingConfig.company_percentage - 1 : 0)).toFixed(1)} ج.م
                                        </span>
                                    </div>

                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>+ رسوم ثابتة:</span>
                                        <span className="font-mono">{pricingBreakdown.fixedFee} ج.م</span>
                                    </div>

                                    <div className="border-t border-dashed pt-2 mt-2 flex justify-between items-center">
                                        <span className="font-black text-gray-800">السعر النهائي:</span>
                                        <span className="text-2xl font-black text-green-600">
                                            {pricingBreakdown.customerPrice === 0 ? 'مجاني' : `${pricingBreakdown.customerPrice} ج.م`}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    {/* قسم قيم جدول المقارنة الجديد */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><ListChecks className="text-primary"/> قيم جدول المقارنة</CardTitle>
                            <CardDescription>حدد القيم التي ستظهر في جدول المقارنة بين الباقات في الصفحة العامة.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {comparisonItems.length > 0 ? (
                                <div className="space-y-5">
                                    {comparisonItems.map((item) => (
                                        <div key={item.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center border-b pb-4 last:border-0 last:pb-0">
                                            <div className="font-semibold text-gray-700 md:col-span-1">
                                                {item.label}
                                                <span className="block text-[10px] text-muted-foreground font-mono">{item.id}</span>
                                            </div>
                                            <div className="md:col-span-2">
                                                {item.type === 'boolean' ? (
                                                    <div className="flex items-center gap-3">
                                                        <Checkbox 
                                                            id={`comp-${item.id}`}
                                                            checked={!!pkg.comparison_values?.[item.id]} 
                                                            onCheckedChange={(checked) => handleComparisonChange(item.id, !!checked)} 
                                                        />
                                                        <label htmlFor={`comp-${item.id}`} className="text-sm cursor-pointer select-none">
                                                            {pkg.comparison_values?.[item.id] ? 'متوفر (نعم)' : 'غير متوفر (لا)'}
                                                        </label>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <Type size={16} className="text-muted-foreground" />
                                                        <Input 
                                                            placeholder={`قيمة ${item.label}...`}
                                                            value={(pkg.comparison_values?.[item.id] as string) || ''} 
                                                            onChange={(e) => handleComparisonChange(item.id, e.target.value)} 
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 text-muted-foreground bg-muted/20 rounded-lg">
                                    <p>لم يتم تعريف معايير مقارنة بعد.</p>
                                    <Button variant="link" onClick={() => navigate('/creative-writing-packages?tab=criteria')}>
                                        إدارة المعايير من هنا
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>قائمة الميزات (للعرض في البطاقة)</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <FormField label="الميزات (كل ميزة في سطر)" htmlFor="features">
                                <Textarea id="features" value={featuresString} onChange={e => setFeaturesString(e.target.value)} rows={6} placeholder="جلسات تفاعلية&#10;متابعة دورية&#10;شهادة إتمام" />
                            </FormField>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader><CardTitle>الحالة والأيقونة</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <label className="flex items-center gap-2 p-3 border rounded-lg bg-muted/20 cursor-pointer">
                                <Checkbox checked={pkg.popular} onCheckedChange={v => setPkg({...pkg, popular: !!v})} />
                                <span className="text-sm font-bold">باقة شائعة (تمييز)</span>
                            </label>
                            <FormField label="الأيقونة" htmlFor="icon_name">
                                <Select id="icon_name" value={pkg.icon_name} onChange={e => setPkg({...pkg, icon_name: e.target.value})}>
                                    {Object.keys(IconMap).map(k => <option key={k} value={k}>{k}</option>)}
                                </Select>
                            </FormField>
                            <div className="flex justify-center p-4 bg-gray-50 rounded-lg border">
                                <div className="w-16 h-16 flex items-center justify-center text-primary">
                                    {IconMap[pkg.icon_name || 'Rocket']}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </form>
        </div>
    );
};

export default AdminPackageDetailPage;
