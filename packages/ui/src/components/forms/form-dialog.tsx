import * as React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { cn } from '../../lib/utils';
import { FormHeaderTitle } from './form-header';

export interface FormDialogProps {
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
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  bodyClassName?: string;
}

export function FormDialog({ open, defaultOpen, onOpenChange, trigger, title, icon: Icon, description, children, footer, pending = false, error, maxWidth = 'lg', className, bodyClassName }: FormDialogProps) {
  const maxWidthClass = { sm: 'sm:max-w-sm', md: 'sm:max-w-md', lg: 'sm:max-w-lg', xl: 'sm:max-w-xl', '2xl': 'sm:max-w-2xl' }[maxWidth];
  return <Dialog {...(open === undefined ? {} : { open })} {...(defaultOpen === undefined ? {} : { defaultOpen })} {...(onOpenChange ? { onOpenChange } : {})}>{trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}<DialogContent className={cn(maxWidthClass, 'flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0', className)} aria-busy={pending || undefined}><DialogHeader className="shrink-0 border-b px-6 py-4 pr-12 text-start"><DialogTitle><FormHeaderTitle icon={Icon}>{title}</FormHeaderTitle></DialogTitle>{description ? <DialogDescription>{description}</DialogDescription> : null}</DialogHeader><div className={cn('min-h-0 flex-1 overflow-y-auto px-6 py-4', bodyClassName)}>{error ? <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive" role="alert">{error}</div> : null}{children}</div>{footer ? <div className="shrink-0 border-t bg-muted/30 px-6 py-4">{footer}</div> : null}</DialogContent></Dialog>;
}
