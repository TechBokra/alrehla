import React from 'react';
import Link from 'next/link';
import { Button } from '../../../components/ui/Button';

const placeholder = '/placeholder-image.jpeg';

interface HeroSectionProps {
  backgroundUrl: string | null | undefined;
  content: any;
}

const HeroSection: React.FC<HeroSectionProps> = ({ backgroundUrl, content }) => (
  <section className="relative h-[calc(100vh-4rem)] min-h-[500px] flex items-center justify-center bg-cover bg-center">
    <img
      src={backgroundUrl || placeholder}
      alt="hero-image"
      className="absolute inset-0 w-full h-full object-cover"
      fetchPriority="high"
    />
    <div className="absolute inset-0 bg-gradient-to-br from-blue-900/70 via-purple-900/70 to-black/70" />
    <div className="container mx-auto px-4 text-center relative z-10">
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight animate-fadeIn">
        {content?.heroTitle || 'رحلة كل طفل تبدأ بقصة... وقصته تبدأ هنا'}
      </h1>
      <p
        className="mt-6 max-w-3xl mx-auto text-lg sm:text-xl text-gray-200 animate-fadeIn"
        style={{ animationDelay: '0.2s' }}
      >
        {content?.heroSubtitle ||
          'منصة تربوية عربية متكاملة تصنع قصصاً مخصصة تجعل طفلك بطلاً، وتطلق مواهبه في الكتابة الإبداعية'}
      </p>
      <div
        className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fadeIn"
        style={{ animationDelay: '0.4s' }}
      >
        <Link href="/enha-lak/store" className="inline-block">
          <Button
            as="span"
            size="lg"
            className="shadow-lg transition-transform transform hover:scale-105"
          >
            {content?.heroButtonText1 || 'اطلب قصتك المخصصة الآن'}
          </Button>
        </Link>
        <Link href="/creative-writing" className="inline-block">
          <Button
            as="span"
            size="lg"
            variant="secondary"
            className="shadow-lg transition-transform transform hover:scale-105"
          >
            {content?.heroButtonText2 || 'اكتشف برنامج الكتابة الإبداعية'}
          </Button>
        </Link>
      </div>
    </div>
  </section>
);

export default HeroSection;
