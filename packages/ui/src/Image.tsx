
import React, { useState, useEffect } from 'react';
import { cn } from '@alrehla/utils/utils';
import { ImageIcon } from 'lucide-react';

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src?: any;
    objectFit?: 'cover' | 'contain' | 'fill' | 'none';
    fallbackText?: string;
    showSkeleton?: boolean;
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
  ({ src, alt, className, objectFit = 'cover', fallbackText, showSkeleton = true, onLoad, onError, ...props }, ref) => {
    const DEFAULT_PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNmM2Y0ZjYiLz48L3N2Zz4=';

    const resolvedSrc = resolveSrc(src);
    const [prevSrc, setPrevSrc] = useState<string>(resolvedSrc);
    const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>(resolvedSrc ? 'loading' : 'error');
    const [errorFallback, setErrorFallback] = useState(false);

    if (resolvedSrc !== prevSrc) {
        setPrevSrc(resolvedSrc);
        setStatus(resolvedSrc ? 'loading' : 'error');
        setErrorFallback(false);
    }

    const handleLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        if (resolvedSrc && !errorFallback) {
            setStatus('loaded');
        }
        if (onLoad) onLoad(e);
    };

    const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        setStatus('error');
        setErrorFallback(true);
        if (onError) onError(e);
    };

    const currentSrc = errorFallback || !resolvedSrc ? DEFAULT_PLACEHOLDER : resolvedSrc;

    return (
      <div className={cn("relative overflow-hidden bg-gray-50 flex items-center justify-center isolate", className)}>

        {/* Skeleton Loader - يختفي بسلاسة عند التحميل */}
        {showSkeleton && (
          <div 
            className={cn(
                "absolute inset-0 bg-gray-200 animate-pulse z-10 transition-opacity duration-500",
                status === 'loaded' ? 'opacity-0' : 'opacity-100'
            )} 
          />
        )}
        
        {/* Error State Icon */}
        {status === 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/30 z-0 p-2">
                <ImageIcon size={24} />
                {fallbackText && <span className="text-[9px] font-bold uppercase tracking-widest mt-1 text-center">{fallbackText}</span>}
            </div>
        )}

        <img
          ref={ref}
          src={currentSrc}
          alt={alt || 'image'}
          loading="lazy"
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            "w-full h-full transition-opacity duration-500 ease-in-out relative z-10",
            objectFit === 'cover' ? 'object-cover' : objectFit === 'contain' ? 'object-contain' : 'object-fill',
            status === 'loaded' ? "opacity-100" : "opacity-0"
          )}
          {...props}
        />
      </div>
    );
  }
);
Image.displayName = 'Image';

export default Image;
