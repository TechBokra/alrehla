import * as React from 'react';
import { cn } from './utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ className, invalid = false, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn('ui-input', className)}
        aria-invalid={props['aria-invalid'] ?? (invalid || undefined)}
        {...props}
      />
    );
  }
);

