"use client";


import React from 'react';
import { Link } from '@/lib/router-compat';
import { Target, ArrowLeft, Calendar, CheckCircle, Sparkles, Star, Globe, Palette, Mic, User, Smile, PenSquare, Package } from 'lucide-react';
import ShareButtons from '../../../components/shared/ShareButtons';
import TestimonialCard from '../../../components/shared/TestimonialCard';
import { Button } from '@alrehla/ui/button';
import { usePublicData } from '../../../hooks/queries/public/usePublicDataQuery';
import { Card, CardContent, CardHeader, CardTitle } from '@alrehla/ui/card';
import Image from '@alrehla/ui/next-image';
import type { Instructor } from '../../../lib/database.types';

const WhoIsItForCard: React.FC<{ icon: React.ReactNode, title: string, description: string }> = ({ icon, title, description }) => (
    <Card className="text-center h-full shadow-lg">
        <CardContent className="pt-8">
            <div className="flex-shrink-0 flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary mx-auto mb-4">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-foreground">{title}</h3>
            <p className="mt-2 text-muted-foreground">{description}</p>
        </CardContent>
    </Card>
);

const InstructorShowcaseCard: React.FC<{ instructor: Instructor }> = ({ instructor }) => {
    // استخراج أول جملتين أو سطرين من السيرة الذاتية
    const highlights = instructor.bio
        ? instructor.bio
            .split(/[.\n]/) // التقسيم بناءً على النقطة أو سطر جديد
            .map(s => s.trim())
            .filter(s => s.length > 10) // استبعاد الجمل القصيرة جداً
            .slice(0, 2) // أخذ أول عنصرين فقط
        : [];

    // نص افتراضي في حال لم يتم العثور على جمل صالحة
    const displayPoints = highlights.length > 0 
        ? highlights 
        : ["خبرة في تنمية المهارات الإبداعية", "أسلوب تعليمي متميز"];

    return (
        <Card className="text-center h-full">
            <CardContent className="pt-6">
                <Image src={instructor.avatar_url || "/images/male-avatar.png"} alt={instructor.name} className="w-24 h-24 rounded-full mx-auto object-cover ring-4 ring-primary/10" />
                <h4 className="text-xl font-bold mt-4">{instructor.name}</h4>
                <p className="text-primary font-semibold text-sm mb-4">{instructor.specialty}</p>
                <ul className="text-sm text-muted-foreground space-y-2 text-right">
                    {displayPoints.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                            <Star size={14} className="text-yellow-400 mt-1 flex-shrink-0" />
                            <span className="line-clamp-2">{point}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
};


const CreativeWritingPage: React.FC = () => {
  const pageUrl = window.location.href;
  const { data: publicData } = usePublicData();
  const content = publicData?.siteContent?.creativeWritingPage.main;
  const instructors = publicData?.instructors || [];

  const methodologyPoints = [
      { icon: <Target className="w-8 h-8 text-primary flex-shrink-0 mt-1" />, title: "يصطاد الأفكار", description: "يحول المشاهدات اليومية إلى بذور قصص مدهشة." },
      { icon: <Globe className="w-8 h-8 text-green-500 flex-shrink-0 mt-1" />, title: "يبني العوالم", description: "يخلق شخصيات تتنفس وتعيش في عوالم من صنعه." },
      { icon: <Palette className="w-8 h-8 text-pink-500 flex-shrink-0 mt-1" />, title: "يرسم بالكلمات", description: "يستخدم اللغة كفرشاة ليرسم الصور والمشاعر." },
      { icon: <Mic className="w-8 h-8 text-purple-500 flex-shrink-0 mt-1" />, title: "يحرر صوته", description: "يعبر عن نفسه بثقة، ويكتشف قوة كلماته." },
  ];

  return (
    <div className="bg-muted/50 animate-fadeIn">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-50 via-blue-50 to-background py-16 sm:py-20 lg:py-24 text-center">
        <div className="container mx-auto px-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight">
               {content?.heroTitle.split(':')[0]}: <span className="text-primary">{content?.heroTitle.split(':')[1]}</span>
            </h1>
            <p className="mt-6 max-w-3xl mx-auto text-lg sm:text-xl text-muted-foreground">
                {content?.heroSubtitle}
            </p>
            <div className="mt-10">
                <Button as={Link} to="/creative-writing/packages" size="lg" className="shadow-lg transition-transform transform hover:scale-105">
                    اكتشف الباقات وابدأ الآن
                </Button>
            </div>
            <div className="mt-8 flex justify-center">
                <ShareButtons 
                  title='اكتشف برنامج "بداية الرحلة" للكتابة الإبداعية وصقل موهبة طفلك' 
                  url={pageUrl} 
                  label="شارك البرنامج:"
                />
            </div>
        </div>
      </section>

      {/* Who is this for? Section */}
      <section className="py-16 sm:py-20 lg:py-24">
          <div className="container mx-auto px-4">
              <div className="text-center mb-16">
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground">هل هذا البرنامج مناسب لطفلك؟</h2>
                  <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">نعم، إذا كان طفلك...</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                  <WhoIsItForCard 
                    icon={<User size={32} />}
                    title="الحالم الصغير"
                    description="يمتلك خيالاً لا حدود له ويخترع القصص باستمرار، ويحتاج فقط إلى الأدوات لتحويل هذا الخيال إلى كلمات."
                  />
                  <WhoIsItForCard 
                    icon={<Smile size={32} />}
                    title="الكاتب المتردد"
                    description="يحب القراءة والاستماع للقصص، لكنه يشعر بالخوف أو عدم الثقة عند مواجهة الورقة البيضاء."
                  />
                  <WhoIsItForCard 
                    icon={<PenSquare size={32} />}
                    title="الموهبة الواعدة"
                    description="يُظهر شغفاً بالكتابة بالفعل، ويبحث عن التوجيه الصحيح لصقل موهبته وتطوير أسلوبه الخاص."
                  />
              </div>
          </div>
      </section>

      {/* Methodology Section */}
      <section className="bg-background py-16 sm:py-20 lg:py-24">
        <div className="container mx-auto px-4">
            <div className="text-center mb-16">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground">{content?.methodologyTitle}</h2>
                <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">{content?.methodologySubtitle}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
                {methodologyPoints.map(point => (
                    <Card key={point.title} className="border-t-4 border-primary/50 shadow-md">
                      <CardContent className="pt-6 flex items-start gap-4">
                          {point.icon}
                          <div>
                              <h3 className="text-xl font-bold text-foreground">{point.title}</h3>
                              <p className="text-muted-foreground mt-1">{point.description}</p>
                          </div>
                      </CardContent>
                    </Card>
                ))}
            </div>
        </div>
      </section>

      {/* Our Offerings Section */}
      <section className="bg-muted/50 py-16 sm:py-20 lg:py-24">
          <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-12">خياراتنا المرنة</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
                  <Card className="text-center">
                      <CardHeader>
                          <Package size={48} className="mx-auto text-primary" />
                          <CardTitle className="text-2xl">{content?.packagesTitle}</CardTitle>
                      </CardHeader>
                      <CardContent>
                          <p className="text-muted-foreground">{content?.packagesSubtitle}</p>
                          <Button as={Link} to="/creative-writing/packages" className="mt-6">قارن بين الباقات</Button>
                      </CardContent>
                  </Card>
                   <Card className="text-center">
                      <CardHeader>
                          <Sparkles size={48} className="mx-auto text-primary" />
                          <CardTitle className="text-2xl">{content?.servicesTitle}</CardTitle>
                      </CardHeader>
                      <CardContent>
                          <p className="text-muted-foreground">{content?.servicesSubtitle}</p>
                          <Button as={Link} to="/creative-writing/services" className="mt-6">تصفح الخدمات الإبداعية</Button>
                      </CardContent>
                  </Card>
              </div>
          </div>
      </section>

      {/* Instructors Showcase */}
      <section className="bg-background py-16 sm:py-20 lg:py-24">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground">{content?.instructorsTitle}</h2>
                <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">{content?.instructorsSubtitle}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {instructors.slice(0, 4).map(instructor => (
                    <InstructorShowcaseCard key={instructor.id} instructor={instructor} />
                ))}
            </div>
             <div className="mt-12 text-center">
                <Link to="/creative-writing/instructors" className="inline-flex items-center font-semibold text-lg text-primary hover:text-primary/80 group">
                    <span>عرض كل المدربين</span>
                    <ArrowLeft size={22} className="ms-2 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
                </Link>
           </div>
            </div>
      </section>

       {/* Testimonials Section */}
       <section className="bg-muted/50 py-16 sm:py-20 lg:py-24">
          <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground">{content?.testimonialsTitle}</h2>
                  <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">{content?.testimonialsSubtitle}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                  <TestimonialCard
                      quote="لم أتوقع أن يصبح ابني متحمساً للكتابة بهذا الشكل. البرنامج ساعده على التعبير عن نفسه بثقة وإبداع. شكراً للمدرب على جهوده الرائعة."
                      author="خالد عبد الرحمن"
                      role="ولي أمر طالب"
                  />
                  <TestimonialCard
                      quote="البرنامج أكثر من رائع! الجلسات فردية والتركيز على ابنتي كان كاملاً. لاحظت تطوراً كبيراً في أسلوبها وقدرتها على تنظيم أفكارها."
                      author="مريم العلي"
                      role="ولية أمر طالبة"
                  />
              </div>
          </div>
      </section>

        {/* Final CTA */}
        <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
            <div className="container mx-auto px-4 text-center">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground">{content?.finalCtaTitle}</h2>
                <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">{content?.finalCtaSubtitle}</p>
                <div className="mt-8">
                     <Button as={Link} to="/creative-writing/booking" size="lg" icon={<Calendar className="me-3" size={22}/>} className="shadow-lg transition-transform transform hover:scale-105">
                           عرض الباقات وحجز موعد
                    </Button>
                </div>
            </div>
        </section>
        
    </div>
  );
};

export default CreativeWritingPage;
