import * as React from 'react';
import { cn } from '../../lib/utils';

export interface PageHeaderProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  title: React.ReactNode;
  description?: React.ReactNode;
  eyebrow?: React.ReactNode;
  actions?: React.ReactNode;
}

const PageHeader = React.forwardRef<HTMLElement, PageHeaderProps>(({ className, title, description, eyebrow, actions, children, ...props }, ref) => (
  <header ref={ref} className={cn('flex flex-col gap-4 border-b bg-background pb-6 md:flex-row md:items-end md:justify-between', className)} {...props}>
    <div className="space-y-2">
      {eyebrow && <p className="text-sm font-medium text-muted-foreground">{eyebrow}</p>}
      <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">{title}</h1>
      {description && <p className="max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">{description}</p>}
      {children}
    </div>
    {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
  </header>
));
PageHeader.displayName = 'PageHeader';

export { PageHeader };
