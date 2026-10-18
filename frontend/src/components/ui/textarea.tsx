import * as React from 'react';
import { cn } from './utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, invalid = false, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn('ui-textarea', className)}
        aria-invalid={props['aria-invalid'] ?? (invalid || undefined)}
        {...props}
      />
    );
  }
);

