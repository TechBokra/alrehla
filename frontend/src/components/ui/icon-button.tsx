import * as React from 'react';
import { Button, type ButtonProps, type ButtonSize, type ButtonVariant } from './button';
import { cn } from './utils';

export interface IconButtonProps
  extends Omit<ButtonProps, 'children' | 'aria-label'> {
  /** Accessible name announced by screen readers. */
  label: string;
  children: React.ReactNode;
  variant?: Exclude<ButtonVariant, 'link'>;
  size?: ButtonSize;
}

export function IconButton({
  label,
  children,
  className,
  ...props
}: IconButtonProps) {
  return (
    <Button
      aria-label={label}
      className={cn('ui-icon-button', className)}
      {...props}
    >
      {children}
    </Button>
  );
}

