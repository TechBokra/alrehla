import Image from '@alrehla/ui/next-image';
import React from 'react';
import Link from 'next/link';
import { Button } from '@alrehla/ui/button';

const HERO_FALLBACK_IMAGE = '/placeholder-image.jpeg';

interface HeroSectionProps {
  backgroundUrl: string | null | undefined;
  content: any;
}

const HeroSection: React.FC<HeroSectionProps> = ({ backgroundUrl, content }) => {
  const imageUrl =
    !backgroundUrl || backgroundUrl.includes('placehold.co') ? HERO_FALLBACK_IMAGE : backgroundUrl;

  return (
    <section className="relative isolate flex h-[calc(100svh-4rem)] min-h-[500px] items-center justify-center overflow-hidden bg-slate-900">
      <div className="absolute inset-0 -z-10">
        <Image
          src={imageUrl}
          alt=""
          aria-hidden="true"
          className="h-full w-full"
          objectFit="cover"
          priority
          showSkeleton={false}
          fetchPriority="high"
          width={1920}
          height={1080}
          sizes="100vw"
        />
      </div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-900/70 via-purple-900/70 to-black/70" />
      <div className="container relative z-10 mx-auto px-4 text-center">
        <h1 className="animate-fadeIn text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
          {content?.heroTitle || 'رحلة كل طفل تبدأ بقصة... وقصته تبدأ هنا'}
        </h1>
        <p
          className="mx-auto mt-6 max-w-3xl animate-fadeIn text-lg text-gray-200 sm:text-xl"
          style={{ animationDelay: '0.2s' }}
        >
          {content?.heroSubtitle ||
            'منصة تربوية عربية متكاملة تصنع قصصاً مخصصة تجعل طفلك بطلاً، وتطلق مواهبه في الكتابة الإبداعية'}
        </p>
        <div
          className="mt-10 flex animate-fadeIn flex-col items-center justify-center gap-4 sm:flex-row"
          style={{ animationDelay: '0.4s' }}
        >
          <Link href="/enha-lak" className="inline-block">
            <Button as="span" size="lg" className="shadow-lg transition-transform hover:scale-105">
              {content?.heroButtonText1 || 'اطلب قصتك المخصصة الآن'}
            </Button>
          </Link>
          <Link href="/creative-writing" className="inline-block">
            <Button
              as="span"
              size="lg"
              variant="secondary"
              className="shadow-lg transition-transform hover:scale-105"
            >
              {content?.heroButtonText2 || 'اكتشف برنامج الكتابة الإبداعية'}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
