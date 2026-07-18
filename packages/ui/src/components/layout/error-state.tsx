import * as React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

export interface ErrorStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  message: React.ReactNode;
  onRetry?: () => void;
  retryLabel?: React.ReactNode;
  action?: React.ReactNode;
}

const ErrorState = React.forwardRef<HTMLDivElement, ErrorStateProps>(({ className, title = 'Something went wrong', message, onRetry, retryLabel = 'Try again', action, ...props }, ref) => (
  <div ref={ref} className={cn('mx-auto flex max-w-lg flex-col items-center justify-center rounded-lg border border-destructive/20 bg-destructive/5 p-8 text-center', className)} {...props}>
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
      <AlertTriangle className="h-6 w-6" />
    </div>
    <h3 className="text-base font-semibold text-foreground">{title}</h3>
    <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{message}</p>
    {(onRetry || action) && (
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {onRetry && <Button type="button" variant="outline" onClick={onRetry}><RefreshCw className="me-2 h-4 w-4" />{retryLabel}</Button>}
        {action}
      </div>
    )}
  </div>
));
ErrorState.displayName = 'ErrorState';

export { ErrorState };
export default ErrorState;
