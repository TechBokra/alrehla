'use client';

import React, { useEffect, useState } from 'react';
import NextImage from 'next/image';
import { ImageIcon } from 'lucide-react';
import { cn } from './lib/utils';
import { AlhrelaImage } from './components/media/alhrela-image';

interface ImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'width' | 'height'> {
  src?: any;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none';
  fallbackText?: string;
  showSkeleton?: boolean;
  width?: number | string;
  height?: number | string;
  sizes?: string;
  priority?: boolean;
}

const DEFAULT_PLACEHOLDER = '/placeholder-image.jpeg';

const resolveSrc = (src: any): string => {
  if (!src) return '';
  if (typeof src === 'object' && src !== null && 'url' in src) {
    return src.url;
  }
  if (typeof src === 'string') {
    if (src.startsWith('{') && src.endsWith('}')) {
      try {
        const parsed = JSON.parse(src);
        if (parsed?.url) return parsed.url;
      } catch {
        // Fall back to the original string below.
      }
    }
    return src;
  }
  return '';
};

const toNumber = (value: number | string | undefined, fallback: number) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const getPublicIdFromUrl = (url: string): string | null => {
  if (!url || !url.includes('cloudinary.com')) return null;
  try {
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;
    
    const pathAfterUpload = parts[1];
    const versionRegex = /^v\d+\//;
    const cleanPath = pathAfterUpload.replace(versionRegex, '');
    
    const dotIndex = cleanPath.lastIndexOf('.');
    if (dotIndex === -1) return cleanPath;
    return cleanPath.substring(0, dotIndex);
  } catch (e) {
    return null;
  }
};

const NextImageComponent = React.forwardRef<HTMLImageElement, ImageProps>(
  (
    {
      src,
      alt,
      className,
      objectFit = 'cover',
      fallbackText,
      showSkeleton = true,
      onLoad,
      onError,
      width,
      height,
      sizes,
      priority,
      ...props
    },
    ref,
  ) => {
    const resolvedSrc = resolveSrc(src);
    const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>(
      resolvedSrc ? 'loading' : 'error',
    );
    const [errorFallback, setErrorFallback] = useState(false);

    useEffect(() => {
      setStatus(resolvedSrc ? 'loading' : 'error');
      setErrorFallback(false);
    }, [resolvedSrc]);

    const handleLoad = (e: any) => {
      setStatus('loaded');
      onLoad?.(e as any);
    };

    const handleError = (e: any) => {
      setStatus('error');
      setErrorFallback(true);
      onError?.(e as any);
    };

    const currentSrc = errorFallback || !resolvedSrc ? DEFAULT_PLACEHOLDER : resolvedSrc;
    const isCloudinaryUrl = currentSrc.includes('cloudinary.com');
    const cloudinaryPublicId = isCloudinaryUrl
      ? getPublicIdFromUrl(currentSrc)
      : null;

    const imageWidth = toNumber(width, 800);
    const imageHeight = toNumber(height, 600);
    const imageAlt = alt ?? '';
    const objectFitClass =
      objectFit === 'cover'
        ? 'object-cover'
        : objectFit === 'contain'
          ? 'object-contain'
          : objectFit === 'none'
            ? 'object-none'
            : 'object-fill';
    const transitionClass = 'relative z-10 h-full w-full transition-opacity duration-500 ease-in-out';
    const opacityClass = status === 'loading' && showSkeleton && !priority ? 'opacity-0' : 'opacity-100';

    return (
      <div
        className={cn(
          'relative isolate flex items-center justify-center overflow-hidden bg-gray-50',
          className,
        )}
      >
        {showSkeleton && status === 'loading' && !priority && (
          <div className="absolute inset-0 z-10 animate-pulse bg-gray-200" />
        )}

        {status === 'error' && (
          <div className="absolute inset-0 z-0 flex flex-col items-center justify-center p-2 text-muted-foreground/30">
            <ImageIcon size={24} aria-hidden="true" />
            {fallbackText && (
              <span className="mt-1 text-center text-[9px] font-bold uppercase tracking-widest">
                {fallbackText}
              </span>
            )}
          </div>
        )}

        {isCloudinaryUrl && cloudinaryPublicId ? (
          <AlhrelaImage
            publicId={cloudinaryPublicId}
            alt={imageAlt}
            onLoad={handleLoad}
            onError={handleError}
            sizes={sizes || '(max-width: 768px) 100vw, 50vw'}
            width={imageWidth}
            height={imageHeight}
            className={cn(transitionClass, objectFitClass, opacityClass)}
            priority={priority}
            // @ts-ignore
            ref={ref}
            {...(props as any)}
          />
        ) : (
          <NextImage
            src={currentSrc}
            alt={imageAlt}
            onLoad={handleLoad}
            onError={handleError}
            width={imageWidth}
            height={imageHeight}
            sizes={sizes}
            priority={priority}
            className={cn(transitionClass, objectFitClass, opacityClass)}
            // @ts-ignore
            ref={ref}
            {...(props as any)}
          />
        )}
      </div>
    );
  },
);
NextImageComponent.displayName = 'Image';

export default NextImageComponent;
