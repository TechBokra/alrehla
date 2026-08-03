import React from 'react';
import Image from 'next/image';
import { cn } from '../../lib/utils';

export interface AlrehlaLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  showText?: boolean;
  textClassName?: string;
  containerClassName?: string;
  className?: string;
  alt?: string;
  priority?: boolean;
}

export function AlrehlaLogo({
  size = 'md',
  className,
  containerClassName,
  alt = 'شعار منصة الرحلة',
  priority = true,
}: AlrehlaLogoProps) {
  const pixelSize =
    typeof size === 'number'
      ? size
      : size === 'sm'
        ? 32
        : size === 'lg'
          ? 56
          : size === 'xl'
            ? 80
            : 40;

  return (
    <div className={cn('inline-flex items-center gap-2.5', containerClassName)}>
      <Image
        src="/images/logo.png"
        alt={alt}
        width={pixelSize}
        height={pixelSize}
        priority={priority}
        className={cn('object-contain shrink-0', className)}
      />
    </div>
  );
}
