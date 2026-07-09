import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface LoadingStateProps extends React.HTMLAttributes<HTMLDivElement> {
  text?: React.ReactNode;
  fullPage?: boolean;
}

const LoadingState = React.forwardRef<HTMLDivElement, LoadingStateProps>(({ className, text = 'Loading...', fullPage = false, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col items-center justify-center gap-3 text-center text-muted-foreground', fullPage ? 'min-h-[80vh] w-full' : 'py-10', className)} {...props}>
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
    {text && <p className="text-sm font-medium">{text}</p>}
  </div>
));
LoadingState.displayName = 'LoadingState';

export { LoadingState };
export default LoadingState;
