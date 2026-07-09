import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { cn } from '../../lib/utils';

export interface SectionProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  contentClassName?: string;
  asCard?: boolean;
}

const Section = React.forwardRef<HTMLElement, SectionProps>(({ className, title, description, icon, actions, children, contentClassName, asCard = true, ...props }, ref) => {
  const header = (title || description || icon || actions) && (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3">
        {icon && <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">{icon}</div>}
        <div className="space-y-1">
          {title && <CardTitle className="text-xl">{title}</CardTitle>}
          {description && <p className="text-sm leading-6 text-muted-foreground">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );

  if (!asCard) {
    return (
      <section ref={ref} className={cn('space-y-4', className)} {...props}>
        {header}
        <div className={contentClassName}>{children}</div>
      </section>
    );
  }

  return (
    <Card ref={ref} as="section" className={className} {...props}>
      {header && <CardHeader>{header}</CardHeader>}
      <CardContent className={cn(!header && 'pt-6', contentClassName)}>{children}</CardContent>
    </Card>
  );
});
Section.displayName = 'Section';

export { Section };
export default Section;
