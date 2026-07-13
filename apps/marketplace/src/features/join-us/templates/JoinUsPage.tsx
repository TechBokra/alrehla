"use client";

import React, { useState } from 'react';
import { PenTool, Mic, Palette, Send, Heart, Users, Briefcase, Rocket } from 'lucide-react';
import { useCommunicationMutations } from '../../../hooks/mutations/useCommunicationMutations';
import OpportunityCard from '../../../components/shared/OpportunityCard';
import { Button } from '../../../components/ui/Button';
import FormField from '../../../components/ui/FormField';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import Image from '../../../components/ui/Image';
import { useProduct } from '../../../contexts/ProductContext';

const ValueCard: React.FC<{ icon: React.ReactNode; title: string; description: string; }> = ({ icon, title, description }) => (
    <div className="text-center">
        <div className="flex-shrink-0 flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary mx-auto mb-4">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-foreground">{title}</h3>
        <p className="text-muted-foreground mt-2">{description}</p>
    </div>
);


const JoinUsPage: React.FC = () => {
    const { createJoinRequest } = useCommunicationMutations();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { siteBranding } = useProduct();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        try {
            await createJoinRequest.mutateAsync({
                name: data.name as string,
                email: data.email as string,
                phone: data.phone as string,
                role: data.role as string,
                message: data.message as string,
                portfolio_url: data.portfolio_url as string,
            });
            (e.target as HTMLFormElement).reset();
        } catch (error) {
            // Error toast is handled in the mutation hook
        } finally {
            setIsSubmitting(false);
        }
    };

    const roleOptions = ["مدرب/ة في برنامج 'بداية الرحلة'", "رسام/ة لقصص 'إنها لك'", "معلق/ة صوتي/ة للقصص", "كاتب/ة قصص أطفال", "دور آخر"];
    const whyJoinValues = [
        { icon: <Heart size={32}/>, title: 'أحدث فرقاً', description: 'ساهم في تشكيل عقول وقلوب الجيل القادم بمحتوى هادف وملهم.' },
        { icon: <Users size={32}/>, title: 'انضم لمجتمع مبدع', description: 'كن جزءاً من فريق شغوف من الكتّاب والرسامين والتربويين.' },
        { icon: <Briefcase size={32}/>, title: 'مرونة في العمل', description: 'استمتع بحرية العمل عن بعد والمساهمة في الأوقات التي تناسبك.' },
        { icon: <Rocket size={32}/>, title: 'فرص للنمو', description: 'طور مهاراتك وشارك في مشروع ينمو ويتطور باستمرار.' },
    ];

    return (
        <div className="bg-muted/50 py-16 sm:py-20 animate-fadeIn">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                {/* Hero Section */}
                <section className="mb-20">
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h1 className="text-4xl sm:text-5xl font-extrabold text-primary">كن جزءاً من رحلة الإلهام</h1>
                            <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
                                نحن نؤمن بأن كل قصة تُروى وكل موهبة تُصقل هي بذرة لمستقبل أفضل. إذا كنت تشاركنا هذا الشغف، فمكانك معنا.
                            </p>
                        </div>
                        <div>
                            <Image src={siteBranding?.joinUsImageUrl || "/images/join-us-hero.jpg"} alt="فريق عمل مبدع" className="rounded-2xl shadow-xl aspect-video" />
                        </div>
                    </div>
                </section>
                
                 {/* Why Join Us Section */}
                <section className="mb-20 py-16 bg-background rounded-2xl">
                     <div className="container mx-auto px-4">
                        <h2 className="text-3xl font-bold text-center text-foreground mb-12">لماذا تنضم إلى فريق الرحلة؟</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
                            {whyJoinValues.map(value => <ValueCard key={value.title} {...value} />)}
                        </div>
                    </div>
                </section>


                <section className="mb-20">
                    <h2 className="text-3xl font-bold text-center text-foreground mb-12">الفرص المتاحة</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        <OpportunityCard 
                            icon={<PenTool size={32} />}
                            title="مدرب كتابة إبداعية"
                            description="إرشاد وتوجيه الأطفال في رحلتهم لاكتشاف أصواتهم الإبداعية من خلال جلسات فردية ملهمة."
                        />
                         <OpportunityCard 
                            icon={<Palette size={32} />}
                            title="رسام قصص أطفال"
                            description="تحويل الكلمات إلى عوالم بصرية ساحرة، ورسم شخصيات تبقى في ذاكرة الأطفال."
                        />
                         <OpportunityCard 
                            icon={<Mic size={32} />}
                            title="معلق صوتي"
                            description="إعطاء حياة وشخصية للكلمات من خلال الأداء الصوتي للقصص المخصصة والمحتوى الصوتي."
                        />
                    </div>
                </section>
                
                <section className="max-w-2xl mx-auto" id="application-form">
                     <Card>
                        <CardHeader>
                            <CardTitle className="text-2xl text-center">قدم طلبك الآن</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <FormField label="الاسم*" htmlFor="name">
                                        <Input type="text" name="name" id="name" required />
                                    </FormField>
                                    <FormField label="البريد الإلكتروني*" htmlFor="email">
                                        <Input type="email" name="email" id="email" required />
                                    </FormField>
                                </div>
                                 <FormField label="رقم الهاتف*" htmlFor="phone">
                                    <Input type="tel" name="phone" id="phone" required />
                                </FormField>
                                <FormField label="الدور المطلوب*" htmlFor="role">
                                    <Select name="role" id="role" required>
                                        {roleOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </Select>
                                </FormField>
                                <FormField label="رابط معرض الأعمال (اختياري)" htmlFor="portfolio_url">
                                    <Input type="url" name="portfolio_url" id="portfolio_url" placeholder="https://behance.net/yourname" />
                                </FormField>
                                <FormField label="رسالتك*" htmlFor="message">
                                    <Textarea id="message" name="message" rows={5} required placeholder="أخبرنا المزيد عنك وعن سبب اهتمامك بالانضمام إلينا..."/>
                                </FormField>
                                <Button type="submit" loading={isSubmitting} icon={<Send size={18} />} className="w-full">
                                    {isSubmitting ? 'جاري الإرسال...' : 'إرسال الطلب'}
                                </Button>
                            </form>
                        </CardContent>
                     </Card>
                </section>
            </div>
        </div>
    );
};

export default JoinUsPage;