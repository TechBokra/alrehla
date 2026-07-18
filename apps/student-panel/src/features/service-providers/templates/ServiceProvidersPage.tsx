"use client";


import React from 'react';
import { useParams, Link, useNavigate } from '@/lib/router-compat';
import { usePublicData } from '../../../hooks/queries/public/usePublicDataQuery';
import PageLoader from '@alrehla/ui/page-loader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@alrehla/ui/card';
import { Button } from '@alrehla/ui/button';
import { ArrowLeft, UserCheck, Star } from 'lucide-react';
import Image from '@alrehla/ui/next-image';
import type { Instructor, StandaloneService } from '../../../lib/database.types';
import { calculateCustomerPrice } from '../../../utils/pricingCalculator';

const ServiceProvidersPage: React.FC = () => {
    const { serviceId } = useParams<{ serviceId: string }>();
    const navigate = useNavigate();
    const { data, isLoading } = usePublicData();

    if (isLoading) return <PageLoader text="جاري تحميل مقدمي الخدمة..." />;

    const service = data?.standaloneServices.find(s => s.id === Number(serviceId));
    const pricingConfig = data?.pricingSettings;
    
    if (!service) {
        return (
            <div className="container mx-auto py-20 text-center">
                <h2 className="text-2xl font-bold text-red-600">الخدمة غير موجودة</h2>
                <Button as={Link} to="/creative-writing/services" variant="outline" className="mt-4">
                    العودة للخدمات
                </Button>
            </div>
        );
    }

    const providers = (data?.instructors || []).filter(
        (i: Instructor) => i.service_rates && i.service_rates[service.id]
    );

    return (
        <div className="bg-gray-50 py-16 sm:py-20 animate-fadeIn min-h-screen">
            <div className="container mx-auto px-4 max-w-5xl">
                <Link to="/creative-writing/services" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary font-semibold mb-6">
                    <ArrowLeft size={16} />
                    العودة للخدمات
                </Link>

                <div className="text-center mb-12">
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800 mb-4">
                        اختر مدربك لخدمة: <span className="text-primary">{service.name}</span>
                    </h1>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        نخبة من المدربين المتخصصين جاهزون لمساعدتك. اختر المدرب الذي يناسب احتياجاتك وميزانيتك.
                    </p>
                </div>

                {providers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {providers.map((instructor: Instructor) => {
                            const netPrice = instructor.service_rates?.[service.id] ?? service.price;
                            const finalPrice = calculateCustomerPrice(netPrice, pricingConfig);

                            return (
                                <Card key={instructor.id} className="hover:shadow-xl transition-shadow duration-300 border-2 border-transparent hover:border-primary/20">
                                    <CardContent className="pt-6 flex flex-col items-center text-center h-full">
                                        <Image 
                                            src={instructor.avatar_url || '/images/male-avatar.png'} 
                                            alt={instructor.name} 
                                            className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md mb-4" 
                                        />
                                        <h3 className="text-xl font-bold text-gray-800">{instructor.name}</h3>
                                        <p className="text-sm text-primary font-medium mb-2">{instructor.specialty}</p>
                                        <p className="text-sm text-muted-foreground line-clamp-2 mb-6 px-2">
                                            {instructor.bio}
                                        </p>
                                        
                                        <div className="mt-auto w-full pt-4 border-t">
                                            <div className="flex justify-between items-center mb-4">
                                                <span className="text-sm text-gray-500">سعر الخدمة</span>
                                                <span className="text-xl font-bold text-green-600">{finalPrice} ج.م</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <Button as={Link} to={`/instructor/${instructor.slug}`} variant="outline" size="sm">
                                                    الملف الشخصي
                                                </Button>
                                                <Button 
                                                    onClick={() => navigate(`/creative-writing/services/${service.id}/order?instructorId=${instructor.id}`)} 
                                                    size="sm"
                                                    className="shadow-md"
                                                >
                                                    اختيار ومتابعة
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-dashed">
                        <UserCheck className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-800">لا يوجد مدربون متاحون حالياً</h3>
                        <p className="mt-2 text-gray-500">للأسف، لا يوجد مدربون يقدمون هذه الخدمة في الوقت الحالي. يرجى التحقق لاحقاً.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ServiceProvidersPage;
