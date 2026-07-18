"use client";


import React, { useState } from 'react';
import { Target, Star, Eye, Shield, Users, CheckCircle, PenTool } from 'lucide-react';
import { usePublicData } from '../../../hooks/queries/public/usePublicDataQuery';
import PageLoader from '@alrehla/ui/page-loader';
import { Card, CardContent } from '@alrehla/ui/card';
import Image from '@alrehla/ui/next-image';

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string; }> = ({ icon, title, description }) => (
    <Card className="h-full">
        <CardContent className="pt-6 flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-primary/10 rounded-full text-primary">
                {icon}
            </div>
            <div>
                <h3 className="text-xl font-bold text-foreground">{title}</h3>
                <p className="mt-1 text-muted-foreground leading-relaxed">{description}</p>
            </div>
        </CardContent>
    </Card>
);


const CreativeWritingAboutPage: React.FC = () => {
    const { data, isLoading } = usePublicData();
    const content = data?.siteContent?.creativeWritingPage.about;

    if (isLoading) return <PageLoader />;

    return (
        <div className="bg-background animate-fadeIn">
            {/* Hero */}
            <section className="bg-muted/50 py-16 sm:py-20">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl sm:text-5xl font-extrabold text-primary">{content?.heroTitle}</h1>
                        <p className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">
                            {content?.heroSubtitle}
                        </p>
                    </div>
                </div>
            </section>
            
            {/* Main Content */}
            <section className="py-16 sm:py-20">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div className="relative">
                           <Image 
                                src={content?.heroImageUrl || "/images/child-learning-online.jpg"}
                                alt="طفل يشارك في جلسة كتابة إبداعية عبر الإنترنت"
                                className="rounded-2xl shadow-2xl aspect-square"
                            />
                        </div>
                        <div className="space-y-8">
                            <h2 className="text-3xl font-bold text-foreground">{content?.mainTitle}</h2>
                            <p className="text-muted-foreground leading-relaxed text-lg">
                               {content?.mainContent}
                            </p>
                            <ul className="space-y-4">
                                <li className="flex items-start"><CheckCircle className="text-green-500 mt-1 me-3 flex-shrink-0"/><span>بيئة آمنة وداعمة تركز على الإلهام بدلاً من النقد.</span></li>
                                <li className="flex items-start"><CheckCircle className="text-green-500 mt-1 me-3 flex-shrink-0"/><span>جلسات فردية مباشرة تضمن الاهتمام الكامل بطفلك.</span></li>
                                <li className="flex items-start"><CheckCircle className="text-green-500 mt-1 me-3 flex-shrink-0"/><span>منهجية مرنة تتكيف مع اهتمامات وشخصية كل طفل.</span></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Philosophy Section */}
            <section className="bg-muted/50 py-16 sm:py-20">
                 <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold text-center text-foreground mb-12">{content?.philosophyTitle}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-5xl mx-auto">
                        <FeatureCard 
                            icon={<Star size={24} />}
                            title="الإلهام أولاً"
                            description="نبدأ بإشعال شرارة الفضول والخيال، فالأفكار العظيمة تولد من الشغف وليس من القواعد."
                        />
                         <FeatureCard 
                            icon={<PenTool size={24} />}
                            title="الممارسة تصنع المبدع"
                            description="نؤمن بأن الكتابة مهارة تنمو بالتجربة، لذلك نوفر مساحة للتعبير الحر والمستمر."
                        />
                         <FeatureCard 
                            icon={<Shield size={24} />}
                            title="الثقة هي المفتاح"
                            description="هدفنا الأسمى هو بناء ثقة الطفل بصوته وقدراته، ليصبح معبراً عن ذاته بطلاقة."
                        />
                    </div>
                </div>
            </section>
        </div>
    );
};
export default CreativeWritingAboutPage;
