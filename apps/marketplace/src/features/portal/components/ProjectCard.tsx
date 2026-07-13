import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { DEFAULT_COVER_IMAGE } from '@/lib/constants';

const themeClasses: Record<string, { text: string; bg: string }> = {
  pink: { text: 'text-pink-600', bg: 'text-pink-600' },
  blue: { text: 'text-blue-600', bg: 'text-blue-600' },
};

interface ProjectCardProps {
  title: string;
  description: string;
  link: string;
  imageUrl: string | null | undefined;
  icon: React.ReactNode;
  btnText: string;
  themeColor: 'pink' | 'blue';
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  title,
  description,
  link,
  imageUrl,
  icon,
  btnText,
  themeColor,
}) => {
  const colorClass = themeClasses[themeColor]?.text || 'text-primary';

  return (
    <Link
      href={link}
      className="group flex flex-col h-full bg-background rounded-3xl overflow-hidden border border-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
    >
      {/* Image Container */}
      <div className="relative h-64 sm:h-72 overflow-hidden bg-muted">
        <Image
          src={imageUrl || DEFAULT_COVER_IMAGE}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />

        {/* Floating Icon */}
        <div
          className={`absolute -bottom-6 right-8 w-14 h-14 flex items-center justify-center rounded-2xl shadow-lg bg-white ${colorClass} z-10 transition-transform group-hover:scale-110 group-hover:rotate-3`}
        >
          {icon}
        </div>
      </div>

      <div className="p-8 pt-10 flex flex-col flex-grow">
        <h3 className="text-2xl font-extrabold text-foreground mb-3 group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-muted-foreground leading-relaxed mb-6 line-clamp-3 flex-grow">
          {description}
        </p>

        <div className={`flex items-center font-bold ${colorClass} mt-auto group-hover:underline`}>
          <span>{btnText}</span>
          <ArrowLeft
            size={20}
            className="ms-2 transition-transform group-hover:-translate-x-2 rtl:group-hover:translate-x-2"
          />
        </div>
      </div>
    </Link>
  );
};

export default ProjectCard;
