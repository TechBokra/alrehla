"use client";

import React from 'react';
import { ArrowLeft, Library, Sparkles } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@alrehla/ui/card';
import { Button } from '@alrehla/ui/button';
import { Link } from '@/lib/router-compat';

const journeys = [
  {
    href: '/enha-lak/custom',
    title: 'أنت البطل هنا',
    description: 'نصنع تجربة وقصة مخصصة لطفلك من الصفر بعد إتمام الطلب.',
    hint: 'اختر المنتج، ثم أخبرنا عن طفلك وأهدافه واهتماماته.',
    icon: Sparkles,
    className: 'border-pink-200 hover:border-pink-400',
    iconClassName: 'bg-pink-100 text-pink-600',
    buttonClassName: 'bg-pink-600 text-white hover:bg-pink-700',
    cta: 'اكتشف التجارب المخصصة',
  },
  {
    href: '/enha-lak/library',
    title: 'المكتبة العامة',
    description: 'اختر قصة جاهزة من المكتبة وخصص غلافها فقط.',
    hint: 'محتوى القصة الأصلي يبقى كما هو ولا تتم إعادة كتابته.',
    icon: Library,
    className: 'border-blue-200 hover:border-blue-400',
    iconClassName: 'bg-blue-100 text-blue-600',
    buttonClassName: 'bg-blue-600 text-white hover:bg-blue-700',
    cta: 'تصفح المكتبة',
  },
] as const;

const EnhaLakJourneyChoice: React.FC = () => (
  <section aria-labelledby="enha-lak-journeys" className="bg-white py-16 sm:py-20">
    <div className="container mx-auto px-4">
      <div className="mx-auto mb-10 max-w-3xl text-center">
        <p className="text-sm font-bold tracking-wide text-primary">اختر تجربتك</p>
        <h2 id="enha-lak-journeys" className="mt-2 text-3xl font-extrabold text-foreground sm:text-4xl">
          قصتك تبدأ من الاختيار الصحيح
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          هل تريد أن نصنع محتوى مخصصاً لطفلك، أم تختار قصة جاهزة وتخصص غلافها؟
        </p>
      </div>

      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2">
        {journeys.map(({ href, title, description, hint, icon: Icon, className, iconClassName, buttonClassName, cta }) => (
          <Card key={href} className={`flex h-full flex-col border-2 shadow-sm transition-colors ${className}`}>
            <CardHeader className="pb-3">
              <div className={`mb-2 flex h-14 w-14 items-center justify-center rounded-2xl ${iconClassName}`}>
                <Icon size={30} aria-hidden="true" />
              </div>
              <CardTitle className="text-2xl">{title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow space-y-3">
              <p className="text-lg font-semibold text-foreground">{description}</p>
              <p className="text-muted-foreground">{hint}</p>
            </CardContent>
            <CardFooter>
              <Button as={Link} to={href} className={`w-full ${buttonClassName}`} icon={<ArrowLeft size={18} />}>
                {cta}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  </section>
);

export default EnhaLakJourneyChoice;
