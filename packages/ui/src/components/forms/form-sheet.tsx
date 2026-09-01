import * as React from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { cn } from '../../lib/utils';
import { FormHeaderTitle } from './form-header';

export interface FormSheetProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactElement;
  title: React.ReactNode;
  icon?: React.ElementType<{ className?: string }>;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  pending?: boolean;
  error?: React.ReactNode;
  side?: 'right' | 'left';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
  bodyClassName?: string;
}

export function FormSheet({ open, defaultOpen, onOpenChange, trigger, title, icon: Icon, description, children, footer, pending = false, error, side = 'right', size = 'md', className, bodyClassName }: FormSheetProps) {
  const sizeClass = { sm: 'sm:max-w-sm', md: 'sm:max-w-md', lg: 'sm:max-w-lg', xl: 'sm:max-w-xl', full: 'sm:max-w-3xl' }[size];
  return <Sheet {...(open === undefined ? {} : { open })} {...(defaultOpen === undefined ? {} : { defaultOpen })} {...(onOpenChange ? { onOpenChange } : {})}>{trigger ? <SheetTrigger asChild>{trigger}</SheetTrigger> : null}<SheetContent side={side} className={cn('flex h-dvh max-h-dvh w-full flex-col gap-0 overflow-hidden p-0', sizeClass, className)} aria-busy={pending || undefined}><SheetHeader className="shrink-0 border-b px-6 py-4 pr-12 text-start"><SheetTitle><FormHeaderTitle icon={Icon}>{title}</FormHeaderTitle></SheetTitle>{description ? <SheetDescription>{description}</SheetDescription> : null}</SheetHeader><div className={cn('min-h-0 flex-1 overflow-y-auto px-6 py-4', bodyClassName)}>{error ? <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive" role="alert">{error}</div> : null}{children}</div>{footer ? <div className="shrink-0 border-t bg-muted/30 px-6 py-4">{footer}</div> : null}</SheetContent></Sheet>;
}
