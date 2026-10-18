import * as React from 'react';
import { cn } from './utils';

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  src?: string | null;
  alt?: string;
  /** Fallback content, usually the user's initials. */
  fallback: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Avatar({
  src,
  alt = 'User avatar',
  fallback,
  size = 'md',
  className,
  ...props
}: AvatarProps) {
  const [imageFailed, setImageFailed] = React.useState(false);
  const showImage = Boolean(src) && !imageFailed;

  return (
    <span
      role="img"
      aria-label={alt}
      className={cn('ui-avatar', `ui-avatar-${size}`, className)}
      {...props}
    >
      {showImage ? (
        <img
          src={src ?? undefined}
          alt=""
          aria-hidden="true"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span aria-hidden="true">{fallback}</span>
      )}
    </span>
  );
}

