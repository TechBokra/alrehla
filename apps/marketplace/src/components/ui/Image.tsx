"use client";

import React, { useState, useEffect } from 'react';
import { cn } from '@alrehla/utils/utils';
import { ImageIcon } from 'lucide-react';
import NextImage from 'next/image';
import { AlhrelaImage } from '@alrehla/ui/components/media/alhrela-image';
import { cloudinaryService } from '../../services/cloudinaryService';

interface ImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'width' | 'height'> {
    src?: any;
    objectFit?: 'cover' | 'contain' | 'fill' | 'none';
    fallbackText?: string;
    showSkeleton?: boolean;
    width?: number | string;
    height?: number | string;
    sizes?: string;
    priority?: boolean;
}

const resolveSrc = (src: any): string => {
    if (!src) return '';
    if (typeof src === 'object' && src !== null && 'url' in src) {
        return src.url;
    }
    if (typeof src === 'string') {
        if (src.startsWith('{') && src.endsWith('}')) {
            try {
                const parsed = JSON.parse(src);
                if (parsed && parsed.url) return parsed.url;
            } catch (e) {
                // ignore
            }
        }
        return src;
    }
    return '';
};

const Image = React.forwardRef<HTMLImageElement, ImageProps>(
  ({ src, alt, className, objectFit = 'cover', fallbackText, showSkeleton = true, onLoad, onError, width, height, sizes, priority, ...props }, ref) => {
    const DEFAULT_PLACEHOLDER = '/images/placeholder-image.jpeg';

    const resolvedSrc = resolveSrc(src);
    const [prevSrc, setPrevSrc] = useState<string>(resolvedSrc);
    const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>(resolvedSrc ? 'loading' : 'error');
    const [errorFallback, setErrorFallback] = useState(false);

    if (resolvedSrc !== prevSrc) {
        setPrevSrc(resolvedSrc);
        setStatus(resolvedSrc ? 'loading' : 'error');
        setErrorFallback(false);
    }

    const handleLoad = (e: any) => {
        if (resolvedSrc && !errorFallback) {
            setStatus('loaded');
        }
        if (onLoad) onLoad(e as any);
    };

    const handleError = (e: any) => {
        setStatus('error');
        setErrorFallback(true);
        if (onError) onError(e as any);
    };

    const currentSrc = errorFallback || !resolvedSrc ? DEFAULT_PLACEHOLDER : resolvedSrc;

    // Check if it's a Cloudinary asset
    const isCloudinaryUrl = currentSrc.includes('cloudinary.com');
    const cloudinaryPublicId = isCloudinaryUrl ? cloudinaryService.getPublicIdFromUrl(currentSrc) : null;

    const objectFitClass = objectFit === 'cover' ? 'object-cover' : objectFit === 'contain' ? 'object-contain' : 'object-fill';
    const transitionClass = "transition-opacity duration-500 ease-in-out relative z-10 w-full h-full";
    const opacityClass = status === 'loaded' ? "opacity-100" : "opacity-0";

    return (
      <div className={cn("relative overflow-hidden bg-gray-50 flex items-center justify-center isolate", className)}>
        {showSkeleton && (
          <div 
            className={cn(
                "absolute inset-0 bg-gray-200 animate-pulse z-10 transition-opacity duration-500",
                status === 'loaded' ? 'opacity-0' : 'opacity-100'
            )} 
          />
        )}
        
        {status === 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/30 z-0 p-2">
                <ImageIcon size={24} />
                {fallbackText && <span className="text-[9px] font-bold uppercase tracking-widest mt-1 text-center">{fallbackText}</span>}
            </div>
        )}

        {isCloudinaryUrl && cloudinaryPublicId ? (
            <AlhrelaImage
                publicId={cloudinaryPublicId}
                alt={alt || 'image'}
                onLoad={handleLoad}
                onError={handleError}
                sizes={sizes || "(max-width: 768px) 100vw, 50vw"}
                width={typeof width === 'number' ? width : parseInt(width as string) || 800}
                height={typeof height === 'number' ? height : parseInt(height as string) || 600}
                className={cn(transitionClass, objectFitClass, opacityClass)}
                priority={priority}
                // @ts-ignore
                ref={ref}
                {...(props as any)}
            />
        ) : (
            <NextImage
                src={currentSrc}
                alt={alt || 'image'}
                onLoad={handleLoad}
                onError={handleError}
                width={typeof width === 'number' ? width : parseInt(width as string) || 800}
                height={typeof height === 'number' ? height : parseInt(height as string) || 600}
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
  }
);
Image.displayName = 'Image';

export default Image;
