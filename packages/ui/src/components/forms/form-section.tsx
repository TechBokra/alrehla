import * as React from 'react';
import { cn } from '../../lib/utils';

export interface FormSectionProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  errorCount?: number;
  children: React.ReactNode;
}

export function FormSection({ title, description, errorCount = 0, children, className, ...props }: FormSectionProps) {
  return <section className={cn('space-y-4', className)} {...props}>{title || description || errorCount > 0 ? <div className="flex items-start justify-between gap-4 border-b pb-2"><div className="space-y-1">{title ? <h3 className="text-base font-semibold tracking-tight">{title}</h3> : null}{description ? <p className="text-xs text-muted-foreground">{description}</p> : null}</div>{errorCount > 0 ? <span className="rounded-full bg-destructive px-2 py-0.5 text-xs font-semibold text-destructive-foreground" aria-label={`${errorCount} errors`}>{errorCount}</span> : null}</div> : null}{children}</section>;
}

export function FormGrid({ columns = 2, className, children, ...props }: React.HTMLAttributes<HTMLDivElement> & { columns?: 1 | 2 | 3 | 4 }) {
  const columnsClass = columns === 1 ? 'grid-cols-1' : columns === 3 ? 'grid-cols-1 md:grid-cols-3' : columns === 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-2';
  return <div className={cn('grid gap-4', columnsClass, className)} {...props}>{children}</div>;
}
