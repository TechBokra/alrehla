import * as React from 'react';
import { Separator } from '../ui/separator';
import { cn } from '../../lib/utils';

export function FormDescription({ children, className }: { children: React.ReactNode; className?: string }) { return <p className={cn('text-sm text-muted-foreground', className)}>{children}</p>; }
export function FormDivider({ className }: { className?: string }) { return <Separator orientation="horizontal" className={cn('h-px w-full', className)} />; }
export function FormRow({ children, className }: { children: React.ReactNode; className?: string }) { return <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-start', className)}>{children}</div>; }
export function FormSidebar({ children, className }: { children: React.ReactNode; className?: string }) { return <aside className={cn('space-y-4', className)}>{children}</aside>; }

export interface FormPageProps {
  title: React.ReactNode;
  icon?: React.ElementType<{ className?: string }>;
  description?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  actions?: React.ReactNode;
  sidebar?: React.ReactNode;
  footer?: React.ReactNode;
  pending?: boolean;
  error?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function FormPage({ title, icon: Icon, description, breadcrumbs, actions, sidebar, footer, pending = false, error, children, className }: FormPageProps) {
  return <div className={cn('mx-auto w-full max-w-7xl space-y-6', className)} aria-busy={pending || undefined}>{breadcrumbs ? <div className="text-sm text-muted-foreground">{breadcrumbs}</div> : null}<header className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-start sm:justify-between"><div className="space-y-1"><h1 className="text-2xl font-bold tracking-tight"><span className="flex items-center gap-2">{Icon ? <Icon className="h-5 w-5" aria-hidden="true" /> : null}{title}</span></h1>{description ? <p className="text-sm text-muted-foreground">{description}</p> : null}</div>{actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}</header>{error ? <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{error}</div> : null}<div className={cn('grid gap-6', sidebar ? 'lg:grid-cols-[minmax(0,1fr)_18rem]' : undefined)}><main className="min-w-0 space-y-6">{children}</main>{sidebar ? <aside className="min-w-0 space-y-6">{sidebar}</aside> : null}</div>{footer ? <footer className="sticky bottom-0 z-10 -mx-4 border-t bg-background/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6">{footer}</footer> : null}</div>;
}

export interface FormActionsProps extends React.HTMLAttributes<HTMLDivElement> { children?: React.ReactNode; align?: 'start' | 'center' | 'end' | 'between'; }
export function FormActions({ children, align = 'end', className, ...props }: FormActionsProps) { const alignment = { start: 'justify-start', center: 'justify-center', end: 'justify-end', between: 'justify-between' }[align]; return <div className={cn('flex flex-wrap items-center gap-3 border-t bg-background/95 py-4 backdrop-blur', alignment, className)} {...props}>{children}</div>; }
