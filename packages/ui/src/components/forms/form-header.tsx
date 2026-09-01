import * as React from 'react';
import { cn } from '../../lib/utils';

export interface FormHeaderTitleProps {
  icon?: React.ElementType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}

export function FormHeaderTitle({ icon: Icon, children, className }: FormHeaderTitleProps) {
  return <span className={cn('flex items-center gap-2', className)}>{Icon ? <Icon className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" /> : null}<span>{children}</span></span>;
}

export interface FormHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function FormHeader({ title, description, actions, className }: FormHeaderProps) {
  return <header className={cn('flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between', className)}><div className="space-y-1"><h2 className="text-lg font-semibold tracking-tight">{title}</h2>{description ? <p className="text-sm text-muted-foreground">{description}</p> : null}</div>{actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}</header>;
}
