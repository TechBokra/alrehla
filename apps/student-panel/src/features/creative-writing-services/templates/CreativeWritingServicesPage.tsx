"use client";


import React, { useMemo } from 'react';
import { usePublicData } from '../../../hooks/queries/public/usePublicDataQuery';
import PageLoader from '@alrehla/ui/page-loader';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { ServiceCard } from '../../../components/creative-writing/services/ServiceCard';
import type { StandaloneService, Instructor } from '../../../lib/database.types';
import { Link, useNavigate } from '@/lib/router-compat';
import { calculateCustomerPrice } from '../../../utils/pricingCalculator';

const CreativeWritingServicesPage: React.FC = () => {
    const { data, isLoading } = usePublicData();
    const navigate = useNavigate();

    const services = data?.standaloneServices || [];
    const instructors = data?.instructors || [];
    const pricingConfig = data?.pricingSettings;
    
    const servicesByCategory = useMemo(() => {
        return (services as StandaloneService[]).reduce((acc, service) => {
            const { category } = service;
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(service);
            return acc;
        }, {} as Record<string, StandaloneService[]>);
    }, [services]);

    const getPriceRange = (service: StandaloneService) => {
        // 1. حساب السعر الأساسي للخدمة (للشركة)
        const baseCustomerPrice = calculateCustomerPrice(service.price, pricingConfig);

        if (service.provider_type !== 'instructor' || !instructors) {
            return { min: baseCustomerPrice, max: baseCustomerPrice };
        }

        // 2. حساب الأسعار لكل المدربين الذين يقدمون الخدمة
        const prices = instructors
            .map((i: Instructor) => i.service_rates?.[service.id])
            .filter((price): price is number => price !== undefined && price !== null)
            .map(netPrice => calculateCustomerPrice(netPrice, pricingConfig));

        if (prices.length === 0) {
            // إذا لم يحدد أي مدرب سعراً، نستخدم السعر الافتراضي للخدمة (المحسوب)
            return { min: baseCustomerPrice, max: baseCustomerPrice };
        }

        // نضيف السعر الافتراضي أيضاً للمقارنة (اختياري، حسب منطق العمل، هنا نركز على المدربين المتاحين)
        // لكن لضمان عدم ظهور "0" أو أخطاء، نعتمد على القيم الموجودة
        return { min: Math.min(...prices), max: Math.max(...prices) };
    };

    const handleServiceSelection = (service: StandaloneService) => {
        navigate(`/creative-writing/services/${service.id}/providers`);
    };

    const handleOrderCompanyService = (service: StandaloneService) => {
        navigate(`/creative-writing/services/${service.id}/order`);
    };
    
    if (isLoading) {
        return <PageLoader text="جاري تحميل الخدمات..." />;
    }

    return (
        <div className="bg-gray-50 py-16 sm:py-20 animate-fadeIn">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-blue-600 flex items-center justify-center gap-3">
                        <Sparkles />
                        الخدمات الإبداعية
                    </h1>
                    <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600">
                        خدمات مصممة خصيصاً لدعم رحلة طفلك الإبداعية في كل خطوة، سواء كان مشتركاً في برامجنا أم لا.
                    </p>
                </div>
                
                {Object.entries(servicesByCategory).map(([category, categoryServices]) => (
                    <section key={category} className="mb-16">
                        <h2 className="text-3xl font-bold text-gray-800 mb-8 border-r-4 border-blue-500 pr-4">
                            {category}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {(categoryServices as StandaloneService[]).map(service => {
                                const { min, max } = getPriceRange(service);
                                return (
                                    <ServiceCard 
                                        key={service.id} 
                                        service={service} 
                                        minPrice={min}
                                        maxPrice={max}
                                        onViewProviders={() => handleServiceSelection(service)}
                                        onOrderNow={() => handleOrderCompanyService(service)}
                                    />
                                )
                            })}
                        </div>
                    </section>
                ))}

                <div className="mt-16 text-center">
                    <Link to="/creative-writing" className="inline-flex items-center font-semibold text-lg text-blue-600 hover:text-blue-800 group">
                        <ArrowLeft size={22} className="ms-2 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
                        <span>العودة إلى صفحة "بداية الرحلة"</span>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default CreativeWritingServicesPage;
