import React, { useState, useEffect } from 'react';
import { Save, Package, Sparkles, AlertCircle, Calculator, Info, MessageSquare } from 'lucide-react';
import { Button } from '@alrehla/ui/button';
import FormField from '@alrehla/ui/form-field';
import { Input } from '@alrehla/ui/input';
import { Textarea } from '@alrehla/ui/textarea';
import { useInstructorMutations } from '../../hooks/mutations/useInstructorMutations';
import { useAdminCWSettings, useAdminPricingSettings } from '../../hooks/queries/settings/useInstructorSettingsQuery';
import type { Instructor } from '../../lib/database.types';
import PageLoader from '@alrehla/ui/page-loader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@alrehla/ui/card';
import { calculateCustomerPrice } from '../../utils/pricingCalculator';

interface InstructorPricingPanelProps {
    instructor: Instructor;
}

const InstructorPricingPanel: React.FC<InstructorPricingPanelProps> = ({ instructor }) => {
    const { data: cwSettings, isLoading: cwLoading } = useAdminCWSettings();
    const { data: pricingConfig, isLoading: pricingLoading } = useAdminPricingSettings();
    const { requestProfileUpdate } = useInstructorMutations();
    
    const [serviceRates, setServiceRates] = useState<Record<string, string>>({});
    const [packageRates, setPackageRates] = useState<Record<string, string>>({});
    const [justification, setJustification] = useState('');

    useEffect(() => {
        if (instructor.service_rates) {
            const rates: Record<string, string> = {};
            Object.entries(instructor.service_rates).forEach(([k, v]) => rates[k] = String(v));
            setServiceRates(rates);
        }
        if (instructor.package_rates) {
            const rates: Record<string, string> = {};
            Object.entries(instructor.package_rates).forEach(([k, v]) => rates[k] = String(v));
            setPackageRates(rates);
        }
    }, [instructor]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const updates = {
            service_rates: Object.fromEntries(Object.entries(serviceRates).map(([k, v]) => [k, parseFloat(v as string) || 0])),
            package_rates: Object.fromEntries(Object.entries(packageRates).map(([k, v]) => [k, parseFloat(v as string) || 0])),
        };

        requestProfileUpdate.mutate({
            instructorId: instructor.id,
            updates,
            justification
        });
    };

    if (cwLoading || pricingLoading) return <PageLoader />;

    const { standaloneServices = [], packages = [] } = cwSettings || {};
    const instructorServices = standaloneServices.filter((s: any) => s.provider_type === 'instructor');
    const adminFeedback = (instructor.pending_profile_data as any)?.admin_feedback;

    return (
        <div className="space-y-8 animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-foreground">إدارة الأسعار</h1>
                    <p className="text-muted-foreground mt-1">حدد صافي ربحك لكل خدمة أو باقة على حدة.</p>
                </div>
                {instructor.profile_update_status === 'pending' && (
                    <div className="bg-orange-50 border border-orange-200 text-orange-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm animate-pulse">
                        <AlertCircle size={16} /> طلب تحديث الأسعار قيد المراجعة حالياً
                    </div>
                )}
            </div>

            {adminFeedback && instructor.profile_update_status !== 'pending' && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg shadow-sm">
                    <div className="flex items-start gap-3">
                        <MessageSquare className="text-blue-600 mt-1" size={20} />
                        <div>
                            <h4 className="font-bold text-blue-800 text-sm">ملاحظة من الإدارة بخصوص التحديث السابق:</h4>
                            <p className="text-blue-700 text-sm mt-1">{adminFeedback}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl flex items-start gap-3 text-sm text-gray-600">
                <Info className="shrink-0 mt-0.5" size={18} />
                <p>
                    <strong>كيفية التسعير:</strong> أدخل المبلغ الصافي الذي ترغب في استلامه في حقل "صافي دخلك".
                    سيقوم النظام تلقائياً بحساب وإظهار السعر النهائي للعميل (شاملاً رسوم المنصة والضرائب) لمساعدتك في اتخاذ القرار.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Package className="text-purple-500"/> تسعير الباقات التدريبية</CardTitle>
                        <CardDescription>حدد سعرك للباقات الكاملة.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {packages.filter((p: any) => p.price > 0).map((pkg: any) => {
                            const netPrice = parseFloat(packageRates[pkg.id] || '0');
                            const customerPrice = calculateCustomerPrice(netPrice, pricingConfig);
                            
                            return (
                                <div key={pkg.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 border rounded-xl hover:border-purple-200 transition-colors bg-white">
                                    <div className="md:col-span-4">
                                        <p className="font-bold text-gray-800">{pkg.name}</p>
                                        <p className="text-xs text-muted-foreground">{pkg.sessions}</p>
                                    </div>
                                    
                                    <div className="md:col-span-4 relative">
                                        <label className="text-[10px] font-bold text-gray-500 mb-1 block">صافي دخلك (ج.م)</label>
                                        <div className="relative">
                                            <Input 
                                                type="number" 
                                                value={packageRates[pkg.id] || ''}
                                                onChange={e => setPackageRates({...packageRates, [pkg.id]: e.target.value})}
                                                className="pl-12 font-bold h-11 border-gray-300 focus:border-purple-500"
                                                placeholder="0"
                                                min="0"
                                            />
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">NET</span>
                                        </div>
                                    </div>

                                    <div className="md:col-span-4 flex items-center justify-end md:justify-center gap-2 bg-gray-50 p-2 rounded-lg border border-dashed">
                                        <Calculator size={14} className="text-gray-400"/>
                                        <div className="text-center">
                                            <p className="text-[10px] text-gray-500 font-bold uppercase">يظهر للعميل بـ</p>
                                            <p className="font-black text-lg text-purple-600">{customerPrice.toLocaleString()} ج.م</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Sparkles className="text-blue-500"/> الخدمات الإضافية</CardTitle>
                        <CardDescription>حدد سعرك للخدمات المنفصلة (استشارات، مراجعات...).</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {instructorServices.map((service: any) => {
                            const netPrice = parseFloat(serviceRates[service.id] || '0');
                            const customerPrice = calculateCustomerPrice(netPrice, pricingConfig);
                            
                            return (
                                <div key={service.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 border rounded-xl hover:border-blue-200 transition-colors bg-white">
                                    <div className="md:col-span-4">
                                        <p className="font-bold text-gray-800">{service.name}</p>
                                        <p className="text-xs text-muted-foreground truncate">{service.description}</p>
                                    </div>
                                    
                                    <div className="md:col-span-4">
                                        <label className="text-[10px] font-bold text-gray-500 mb-1 block">صافي دخلك (ج.م)</label>
                                        <div className="relative">
                                            <Input 
                                                type="number" 
                                                value={serviceRates[service.id] || ''}
                                                onChange={e => setServiceRates({...serviceRates, [service.id]: e.target.value})}
                                                className="pl-12 font-bold h-11 border-gray-300 focus:border-blue-500"
                                                placeholder="0"
                                                min="0"
                                            />
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">NET</span>
                                        </div>
                                    </div>

                                    <div className="md:col-span-4 flex items-center justify-end md:justify-center gap-2 bg-gray-50 p-2 rounded-lg border border-dashed">
                                        <Calculator size={14} className="text-gray-400"/>
                                        <div className="text-center">
                                            <p className="text-[10px] text-gray-500 font-bold uppercase">يظهر للعميل بـ</p>
                                            <p className="font-black text-lg text-blue-600">{customerPrice.toLocaleString()} ج.م</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {instructorServices.length === 0 && <p className="text-center text-muted-foreground py-4">لا توجد خدمات إضافية متاحة للتسعير حالياً.</p>}
                    </CardContent>
                </Card>

                <Card className="border-t-4 border-primary bg-primary/5">
                    <CardContent className="pt-6">
                        <FormField label="رسالة للإدارة (تبرير التعديل)" htmlFor="justification">
                            <Textarea 
                                id="justification" 
                                value={justification} 
                                onChange={e => setJustification(e.target.value)} 
                                required 
                                placeholder="مثال: أرغب في رفع سعري نظراً لزيادة الخبرة والطلب..." 
                                rows={3} 
                                className="bg-white"
                            />
                        </FormField>
                        <div className="mt-6 flex justify-end">
                            <Button type="submit" className="w-full md:w-auto h-12 text-lg px-8 shadow-lg" loading={requestProfileUpdate.isPending} icon={<Save />}>
                                إرسال الأسعار للمراجعة
                            </Button>
                        </div>
                        <p className="text-center text-xs text-muted-foreground mt-3">سيتم مراجعة الأسعار من قبل الإدارة قبل تفعيلها على الموقع.</p>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
};

export default InstructorPricingPanel;
