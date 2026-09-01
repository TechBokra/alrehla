import * as React from 'react';
import { Label } from '../ui/label';
import { cn } from '../../lib/utils';

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: React.ReactNode;
  htmlFor?: string;
  error?: React.ReactNode;
  helperText?: React.ReactNode;
  required?: boolean;
  descriptionId?: string;
  errorId?: string;
  children: React.ReactNode;
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(({ className, label, htmlFor, error, helperText, required, descriptionId, errorId, children, ...props }, ref) => (
  <div ref={ref} className={cn('space-y-2', className)} {...props}>
    {label && (
      <Label htmlFor={htmlFor} className={cn(error && 'text-destructive')}>
        {label}
        {required && <span className="ms-1 text-destructive" aria-hidden="true">*</span>}
      </Label>
    )}
    {children}
    {helperText && !error && <p id={descriptionId} className="text-sm text-muted-foreground">{helperText}</p>}
    {error && <p id={errorId} className="text-sm font-medium text-destructive" role="alert">{error}</p>}
  </div>
));
FormField.displayName = 'FormField';

export { FormField };
export default FormField;
