"use client";

import React from 'react';
import { Book, Award, FileText, GraduationCap, Sparkles, Wand2, Star, CheckCircle } from 'lucide-react';
import { usePublicData } from '../../../hooks/queries/public/usePublicDataQuery';
import PageLoader from '@alrehla/ui/page-loader';
import { Card, CardContent, CardHeader, CardTitle } from '@alrehla/ui/card';

const TimelineStep: React.FC<{ stage: string; title: string; sessions: string; description: string; isLast?: boolean }> = ({ stage, title, sessions, description, isLast = false }) => (
    <div className="relative pl-8 sm:pl-12 py-6">
        {!isLast && <div className="absolute top-5 left-5 -ml-px mt-0.5 h-full w-0.5 bg-border"></div>}
        <div className="relative flex items-center space-x-4 rtl:space-x-reverse">
            <div className="z-10 w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold shadow-md">
                {stage}
            </div>
            <Card className="flex-grow">
                 <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-2xl font-bold text-foreground">{title}</h3>
                        <span className="text-sm font-semibold bg-primary/10 text-primary px-3 py-1 rounded-full">{sessions}</span>
                    </div>
                    <p className="mt-3 text-muted-foreground">{description}</p>
                 </CardContent>
            </Card>
        </div>
    </div>
);


const CreativeWritingCurriculumPage: React.FC = () => {
    const { data, isLoading } = usePublicData();
    const content = data?.siteContent?.creativeWritingPage.curriculum;

    if (isLoading) return <PageLoader />;

    return (
        <div className="bg-muted/50 py-16 sm:py-20 animate-fadeIn">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16 max-w-3xl mx-auto">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-primary">{content?.heroTitle}</h1>
                    <p className="mt-4 text-lg text-muted-foreground">
                        {content?.heroSubtitle}
                    </p>
                </div>

                <div className="max-w-4xl mx-auto">
                    <TimelineStep 
                        stage="1"
                        title="اكتشاف الصوت"
                        sessions="الجلسات 1-3"
                        description="في هذه المرحلة، نركز على كسر حاجز الخوف من الكتابة. يتعلم الطفل كيف يصطاد الأفكار من عالمه اليومي، ويبدأ في التعبير عن نفسه بثقة من خلال تدريبات ممتعة على الوصف والسرد البسيط."
                    />
                     <TimelineStep 
                        stage="2"
                        title="صياغة الحكاية"
                        sessions="الجلسات 4-8"
                        description="هنا تبدأ المغامرة الحقيقية. نغوص أعمق في فن بناء الشخصيات، وخلق العوالم، ونسج الأحداث. يتعلم الطفل أدوات السرد الأساسية ويجرب تقنيات إبداعية متنوعة لتطوير قصصه."
                    />
                     <TimelineStep 
                        stage="3"
                        title="إتقان السرد"
                        sessions="الجلسات 9-12"
                        description="المرحلة الأخيرة حيث يتحول الكاتب الصغير إلى صانع قصص متمرس. نركز على تحرير النصوص، مراجعتها، وإضافة اللمسات النهائية التي تجعل القصة تتألق، استعداداً لمشاركتها مع العالم."
                        isLast
                    />
                </div>

                 <div className="mt-24">
                    <div className="text-center mb-16 max-w-3xl mx-auto">
                         <h2 className="text-4xl font-extrabold text-foreground flex items-center justify-center gap-3">
                            <Sparkles className="text-yellow-400" /> {content?.treasuresTitle} <Sparkles className="text-yellow-400" />
                        </h2>
                        <p className="mt-4 text-lg text-muted-foreground">
                            {content?.treasuresSubtitle}
                        </p>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        <Card className="bg-blue-50/50 border-blue-200">
                           <CardHeader>
                                <CardTitle className="text-2xl flex items-center gap-3"><FileText /> المحفظة الرقمية</CardTitle>
                           </CardHeader>
                           <CardContent>
                                <ul className="space-y-3 list-none text-muted-foreground">
                                    <li className="flex items-start"><Star className="text-yellow-500 mt-1 me-3 flex-shrink-0"/><span><span className="font-semibold text-foreground">3-5 أعمال إبداعية مكتملة</span> (قصص، خواطر، بداية رواية).</span></li>
                                    <li className="flex items-start"><Star className="text-yellow-500 mt-1 me-3 flex-shrink-0"/><span>تسجيلات صوتية للطفل وهو يقرأ أفضل أعماله بفخر.</span></li>
                                </ul>
                           </CardContent>
                        </Card>
                        <Card className="bg-green-50/50 border-green-200">
                           <CardHeader>
                                <CardTitle className="text-2xl flex items-center gap-3"><GraduationCap /> شهادة وتقرير الإنجاز</CardTitle>
                           </CardHeader>
                           <CardContent>
                                <ul className="space-y-3 list-none text-muted-foreground">
                                    <li className="flex items-start"><Star className="text-yellow-500 mt-1 me-3 flex-shrink-0"/><span><span className="font-semibold text-foreground">شهادة معتمدة</span> تثبت إتمام البرنامج بنجاح.</span></li>
                                    <li className="flex items-start"><Star className="text-yellow-500 mt-1 me-3 flex-shrink-0"/><span><span className="font-semibold text-foreground">تقرير مفصل</span> من المدرب يوضح نقاط القوة ومسارات التطوير المستقبلية.</span></li>
                                </ul>
                           </CardContent>
                        </Card>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default CreativeWritingCurriculumPage;
