import * as React from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface EmptyStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(({ className, icon, title, description, action, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col items-center justify-center rounded-lg border border-dashed bg-background p-8 text-center', className)} {...props}>
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
      {icon ?? <Inbox className="h-6 w-6" />}
    </div>
    <h3 className="text-base font-semibold text-foreground">{title}</h3>
    {description && <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>}
    {action && <div className="mt-6">{action}</div>}
  </div>
));
EmptyState.displayName = 'EmptyState';

export { EmptyState };
