"use client";


import React, { useMemo } from 'react';
import { Link } from '@/lib/router-compat';
import { usePublicData } from '../../../hooks/queries/public/usePublicDataQuery';
import PageLoader from '@alrehla/ui/page-loader';
import { Button } from '@alrehla/ui/button';
import { CheckCircle, X, ArrowLeft, Star, Clock, User, LayoutGrid, Table as TableIcon } from 'lucide-react';
import type { CreativeWritingPackage, Instructor, ComparisonItem } from '../../../lib/database.types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@alrehla/ui/tabs';
import { Card, CardContent, CardFooter, CardHeader } from '@alrehla/ui/card';
import { IconMap } from '../../../components/creative-writing/services/IconMap';

const FeatureRow: React.FC<{ label: string; values: (string | boolean | undefined)[] }> = ({ label, values }) => (
    <tr className="border-b last:border-b-0">
        <th scope="row" className="py-4 px-2 sm:px-4 text-right font-semibold text-gray-700 bg-gray-50/50">{label}</th>
        {values.map((value, index) => (
            <td key={index} className="py-4 px-2 sm:px-4 text-center">
                {typeof value === 'boolean' ? (
                    value ? <CheckCircle className="w-6 h-6 text-green-500 mx-auto" /> : <X className="w-6 h-6 text-gray-400 mx-auto" />
                ) : (
                    <span className="text-gray-600 text-sm sm:text-base">{value || '-'}</span>
                )}
            </td>
        ))}
    </tr>
);

const PackageDetailCard: React.FC<{ pkg: CreativeWritingPackage; priceRange: { min: number, max: number } }> = ({ pkg, priceRange }) => {
    const isFree = pkg.price === 0;
    
    return (
        <Card className={`h-full flex flex-col hover:shadow-xl transition-all duration-300 border-2 ${pkg.popular ? 'border-primary ring-4 ring-primary/10' : 'border-transparent'}`}>
            <CardHeader className={`${pkg.popular ? 'bg-primary/5' : 'bg-gray-50/50'} pb-6`}>
                <div className="flex justify-between items-start mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary border border-gray-100">
                         {IconMap[pkg.icon_name || 'Rocket'] || IconMap['Rocket']}
                    </div>
                    {pkg.popular && (
                        <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                            <Star size={12} fill="currentColor" /> الأكثر شيوعاً
                        </span>
                    )}
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">{pkg.name}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed min-h-[3rem]">{pkg.description}</p>
            </CardHeader>
            
            <CardContent className="flex-grow pt-6 space-y-6">
                <div className="flex items-baseline gap-1">
                    {isFree ? (
                         <span className="text-3xl font-extrabold text-green-600">مجانية</span>
                    ) : (
                        <>
                             <span className="text-sm font-bold text-muted-foreground ml-1">تبدأ من</span>
                             <span className="text-3xl font-extrabold text-foreground">{priceRange.min}</span>
                             <span className="text-sm font-medium text-muted-foreground">ج.م</span>
                        </>
                    )}
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                        <span className="block text-xs text-muted-foreground mb-1">الجلسات</span>
                        <span className="font-semibold text-foreground">{pkg.sessions}</span>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                         <span className="block text-xs text-muted-foreground mb-1">المستوى</span>
                         <span className="font-semibold text-foreground">{pkg.level || 'عام'}</span>
                    </div>
                </div>

                <ul className="space-y-3">
                    {pkg.features.slice(0, 4).map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm">
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700">{feature}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>

            <CardFooter className="pt-4 pb-6">
                <Button as={Link} to="/creative-writing/booking" state={{ selectedPackage: pkg }} className="w-full" size="lg" variant={isFree ? 'success' : (pkg.popular ? 'default' : 'outline')}>
                    {isFree ? 'احجز الآن مجاناً' : 'اكتشف المدربين والأسعار'}
                    <ArrowLeft size={18} className="mr-2 rtl:rotate-180" />
                </Button>
            </CardFooter>
        </Card>
    );
}

const CreativeWritingPackagesPage: React.FC = () => {
    const { data, isLoading } = usePublicData();

    const packages = (data?.creativeWritingPackages || []) as CreativeWritingPackage[];
    const instructors = (data?.instructors || []) as Instructor[];
    // Safe access with fallback using any casting to avoid type errors if interface mismatch
    const comparisonItems = ((data as any)?.comparisonItems || []) as ComparisonItem[];
    
    // تصحيح: استخدام pricingSettings مباشرة من البيانات العامة
    const pricingConfig = data?.pricingSettings || { company_percentage: 1.2, fixed_fee: 50 }; 

    const getPackagePriceRange = (pkg: CreativeWritingPackage) => {
        if (pkg.price === 0) return { min: 0, max: 0 };
        
        const percentage = pricingConfig.company_percentage || 1.2;
        const fixedFee = pricingConfig.fixed_fee || 50;

        // 1. حساب سعر العميل بناءً على سعر الباقة الأساسي (سعر الموقع)
        const siteBaseCustomerPrice = Math.ceil((pkg.price * percentage) + fixedFee);

        // 2. حساب أسعار العملاء بناءً على أسعار المدربين المخصصة
        const instructorCustomerPrices = instructors
            .map(i => {
                const netPrice = i.package_rates?.[pkg.id];
                if (netPrice !== undefined && netPrice !== null) {
                    return Math.ceil((netPrice * percentage) + fixedFee);
                }
                return null;
            })
            .filter((price): price is number => price !== null);

        // 3. تجميع كل الأسعار المحتملة (سعر الموقع + أسعار المدربين)
        const allPossiblePrices = [siteBaseCustomerPrice, ...instructorCustomerPrices];

        return { 
            min: Math.min(...allPossiblePrices), 
            max: Math.max(...allPossiblePrices) 
        };
    };
    
    if (isLoading) return <PageLoader text="جاري تحميل الباقات..." />;

    return (
        <div className="bg-white py-16 sm:py-20 animate-fadeIn">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12 max-w-3xl mx-auto">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-blue-600">باقات بداية الرحلة</h1>
                    <p className="mt-4 text-lg text-gray-600">
                        اختر الباقة المناسبة لطفلك. السعر النهائي يعتمد على المدرب المختار، لكننا نضمن لك دائماً أفضل قيمة.
                    </p>
                </div>

                <Tabs defaultValue="cards" className="w-full">
                    <div className="flex justify-center mb-10">
                        <TabsList className="grid w-full max-w-md grid-cols-2 p-1 bg-gray-100/80 backdrop-blur rounded-full">
                            <TabsTrigger value="cards" className="rounded-full">عرض تفصيلي</TabsTrigger>
                            <TabsTrigger value="compare" className="rounded-full">مقارنة الميزات</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="cards" className="animate-fadeIn">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {packages.map(pkg => (
                                <PackageDetailCard 
                                    key={pkg.id} 
                                    pkg={pkg} 
                                    priceRange={getPackagePriceRange(pkg)}
                                />
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="compare" className="animate-fadeIn">
                        <div className="overflow-x-auto border rounded-2xl shadow-sm">
                            <table className="w-full min-w-[800px] border-collapse text-right bg-white">
                                <thead>
                                    <tr className="border-b-2 border-gray-100">
                                        <th className="py-6 px-4 text-right font-bold text-lg w-1/4 bg-gray-50/50">الميزة</th>
                                        {packages.map(pkg => (
                                            <th key={pkg.id} className="py-6 px-4 text-center font-bold text-lg">
                                                {pkg.name}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    <FeatureRow label="عدد الجلسات" values={packages.map(pkg => pkg.sessions)} />
                                    {comparisonItems.map(item => (
                                        <FeatureRow key={item.id} label={item.label} values={packages.map(pkg => pkg.comparison_values?.[item.id])} />
                                    ))}
                                    <tr className="border-b">
                                        <th scope="row" className="py-6 px-4 text-right font-semibold text-gray-700 bg-gray-50/50">السعر (يبدأ من)</th>
                                        {packages.map(pkg => {
                                            const range = getPackagePriceRange(pkg);
                                            return (
                                                <td key={pkg.id} className="py-6 px-4 text-center font-extrabold text-gray-800">
                                                    {range.min === 0 ? 'مجانية' : `${range.min} ج.م`}
                                                </td>
                                            )
                                        })}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default CreativeWritingPackagesPage;
