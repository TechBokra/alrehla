"use client";


import React, { useMemo } from 'react';
import { Link } from '@/lib/router-compat';
import { BookHeart, Gift, Star, ArrowLeft, CheckCircle, Send, Mic, User, Sparkles } from 'lucide-react';
import TestimonialCard from '../../../components/shared/TestimonialCard';
import ShareButtons from '../../../components/shared/ShareButtons';
import HowItWorksStep from '../../../components/shared/HowItWorksStep';
import { Button } from '@alrehla/ui/button';
import { usePublicData } from '../../../hooks/queries/public/usePublicDataQuery';
import PageLoader from '@alrehla/ui/page-loader';
import { Card, CardContent } from '@alrehla/ui/card';
import Image from '@alrehla/ui/next-image';

const BenefitCard: React.FC<{ icon: React.ReactNode; title: string; description: string; }> = ({ icon, title, description }) => (
    <Card className="text-center h-full shadow-lg">
        <CardContent className="pt-8">
            <div className="flex-shrink-0 flex items-center justify-center h-16 w-16 rounded-full bg-pink-100 text-pink-600 mx-auto mb-4">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-foreground">{title}</h3>
            <p className="mt-2 text-muted-foreground">{description}</p>
        </CardContent>
    </Card>
);

const ProductHighlight: React.FC<{ title: string; description: string; features: string[]; imageUrl: string; ctaLink: string; ctaText: string; isReversed?: boolean }> = ({ title, description, features, imageUrl, ctaLink, ctaText, isReversed = false }) => (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${isReversed ? 'lg:grid-flow-col-dense' : ''}`}>
        <div className={isReversed ? 'lg:col-start-2' : ''}>
            <Image src={imageUrl} alt={title} className="rounded-2xl shadow-2xl aspect-square" />
        </div>
        <div className={isReversed ? 'lg:col-start-1' : ''}>
            <h3 className="text-3xl font-extrabold text-foreground">{title}</h3>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">{description}</p>
            <ul className="mt-6 space-y-3">
                {features.map(feature => (
                    <li key={feature} className="flex items-start gap-3">
                        <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                        <span className="text-muted-foreground">{feature}</span>
                    </li>
                ))}
            </ul>
            <Button as={Link} to={ctaLink} size="lg" variant="pink" className="mt-8">
                {ctaText}
            </Button>
        </div>
    </div>
);


const EnhaLakPage: React.FC = () => {
    const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
    const { data, isLoading } = usePublicData();
    const content = data?.siteContent?.enhaLakPage.main;
    
    // جلب بيانات المنتجات لربط الصور
    const products = data?.personalizedProducts || [];
    const subBoxProduct = useMemo(() => products.find(p => p.key === 'subscription_box'), [products]);
    const customStoryProduct = useMemo(() => products.find(p => p.key === 'custom_story'), [products]);

    if (isLoading) return <PageLoader />;

    return (
        <div className="bg-gray-50 animate-fadeIn">
            {/* Hero Section */}
            <section className="bg-gradient-to-br from-pink-50 via-red-50 to-white py-16 sm:py-20 lg:py-24 text-center">
                <div className="container mx-auto px-4">
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-800 leading-tight">
                        <span className="text-pink-600">{content?.heroTitle.split('...')[0]}...</span> {content?.heroTitle.split('...')[1]}
                    </h1>
                    <p className="mt-6 max-w-3xl mx-auto text-lg sm:text-xl text-gray-600">
                        {content?.heroSubtitle}
                    </p>
                    <div className="mt-10">
                        <Button as={Link} to="/enha-lak/store" size="lg" variant="pink" className="shadow-lg transition-transform transform hover:scale-105">
                           تصفح المنتجات واطلب الآن
                        </Button>
                    </div>
                     <div className="mt-8 flex justify-center">
                        <ShareButtons 
                          title='اكتشف قصص "إنها لك" المخصصة التي تجعل طفلك بطلاً حكايته'
                          url={pageUrl} 
                          label="شارك المشروع:"
                        />
                    </div>
                </div>
            </section>
            
            {/* Power of Personal Story Section */}
            <section className="py-16 sm:py-20 lg:py-24">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground">قوة القصة الشخصية</h2>
                        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">لماذا تعتبر القصة المخصصة أداة تربوية فعالة؟</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        <BenefitCard icon={<User size={32} />} title="تعزيز الهوية" description="عندما يرى الطفل نفسه بطلاً، يزداد تقديره لذاته وثقته بنفسه بشكل كبير." />
                        <BenefitCard icon={<BookHeart size={32} />} title="شغف القراءة" description="الارتباط الشخصي بالقصة يحول القراءة من واجب إلى متعة ومغامرة ينتظرها بشغف." />
                        <BenefitCard icon={<Sparkles size={32} />} title="غرس القيم" description="تصبح الرسائل التربوية والأخلاقية أكثر تأثيراً عندما يعيشها الطفل بنفسه كجزء من الأحداث." />
                    </div>
                </div>
            </section>
            
            {/* Products Showcase */}
            <section className="bg-white py-16 sm:py-20 lg:py-24">
                <div className="container mx-auto px-4 max-w-6xl">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground">{content?.productsTitle}</h2>
                    </div>
                    <div className="space-y-20">
                        <ProductHighlight
                            title="القصة المخصصة"
                            description="جوهر 'إنها لك'، قصة فريدة منسوجة حول شخصية طفلك واهتماماته، تهدف لغرس قيمة تربوية مختارة بعناية."
                            features={["تخصيص كامل للبطل: اسم، صورة، وصف", "اختيار الهدف التربوي من قائمة متنوعة", "متوفرة بنسخ مطبوعة فاخرة وإلكترونية"]}
                            imageUrl={customStoryProduct?.image_url || content?.customStoryImageUrl || "/images/hero-image-new.jpg"}
                            ctaLink="/enha-lak/store"
                            ctaText="اكتشف القصص"
                        />
                        <ProductHighlight
                            title="صندوق الرحلة الشهري"
                            description="هدية متجددة تفتح لطفلك أبواباً جديدة من الخيال والمعرفة كل شهر، مع محتوى حصري ومفاجآت ممتعة."
                            features={["قصة مخصصة جديدة كل شهر", "أنشطة تفاعلية وألعاب تعليمية مبتكرة", "هدية إضافية مختارة بعناية لتناسب عمر الطفل"]}
                            imageUrl={subBoxProduct?.image_url || content?.subscriptionBoxImageUrl || "/images/gift-box-sub.png"}
                            ctaLink="/enha-lak/subscription"
                            ctaText="اعرف المزيد واشترك"
                            isReversed
                        />
                    </div>
                </div>
            </section>
            
            {/* How It Works Section */}
            <section className="bg-muted/50 py-16 sm:py-20 lg:py-24">
              <div className="container mx-auto px-4">
                  <div className="text-center mb-16">
                      <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground">{content?.howItWorksTitle}</h2>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 items-start relative max-w-6xl mx-auto">
                      <HowItWorksStep icon={<Send size={48} className="text-blue-600"/>} title="1. املأ البيانات" description="اسم الطفل، عمره، صورته، هواياته."/>
                      <HowItWorksStep icon={<CheckCircle size={48} className="text-pink-500"/>} title="2. اختر القيمة" description="حدد الهدف التربوي المطلوب."/>
                      <HowItWorksStep icon={<Sparkles size={48} className="text-yellow-500"/>} title="3. انتظر السحر" description="فريقنا ينسج قصة مخصصة تماماً."/>
                      <HowItWorksStep icon={<Gift size={48} className="text-green-500"/>} title="4. استلم واستمتع" description="قصة جاهزة في 7-10 أيام عمل."/>
                  </div>
              </div>
          </section>

            {/* Testimonials Section */}
             <section className="bg-white py-16 sm:py-20 lg:py-24">
                <div className="container mx-auto px-4 text-center">
                     <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground">{content?.testimonialsTitle}</h2>
                     <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">{content?.testimonialsSubtitle}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mt-12">
                        <TestimonialCard
                            quote="قصة 'إنها لك' كانت أفضل هدية لابنتي. رؤية فرحتها وهي ترى نفسها بطلة الحكاية لا تقدر بثمن. شكرًا لكم على هذا الإبداع."
                            author="فاطمة علي"
                            role="ولية أمر"
                        />
                        <TestimonialCard
                            quote="الجودة والاهتمام بالتفاصيل في المنتجات فاقت توقعاتي. تجربة رائعة من الطلب حتى الاستلام. ابني يطلب قراءة قصته كل ليلة."
                            author="أحمد محمود"
                            role="ولي أمر"
                        />
                    </div>
                </div>
            </section>

            {/* Final CTA */}
             <section className="py-20 bg-gradient-to-br from-pink-50 to-red-50">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground">{content?.finalCtaTitle}</h2>
                    <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">{content?.finalCtaSubtitle}</p>
                    <div className="mt-8">
                        <Button as={Link} to="/enha-lak/store" size="lg" variant="pink" icon={<ArrowLeft className="me-3 transform rotate-180" size={22}/>} className="shadow-lg transition-transform transform hover:scale-105">
                            ابدأ تخصيص قصتك الآن
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default EnhaLakPage;
