import Image from '@/components/ui/Image';
import React from 'react';
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
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-background shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative h-64 overflow-hidden bg-muted sm:h-72">
        <Image
          src={imageUrl || DEFAULT_COVER_IMAGE}
          alt={title}
          className="absolute inset-0 h-full w-full transition-transform duration-700 group-hover:scale-110"
          objectFit="cover"
          width={900}
          height={640}
          sizes="(max-width: 768px) 100vw, 50vw"
        />

        <div
          className={`absolute -bottom-6 right-8 z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-3 ${colorClass}`}
        >
          {icon}
        </div>
      </div>

      <div className="flex flex-grow flex-col p-8 pt-10">
        <h3 className="mb-3 text-2xl font-extrabold text-foreground transition-colors group-hover:text-primary">
          {title}
        </h3>
        <p className="mb-6 line-clamp-3 flex-grow leading-relaxed text-muted-foreground">
          {description}
        </p>

        <div className={`mt-auto flex items-center font-bold group-hover:underline ${colorClass}`}>
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
