'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { FormHeaderTitle } from './form-header';

export interface FormWizardDialogStep { id: string; label: string; description?: string; errorCount?: number; }
export interface FormWizardDialogProps { open: boolean; onOpenChange: (open: boolean) => void; title: React.ReactNode; headerIcon?: React.ElementType<{ className?: string }>; description?: React.ReactNode; steps: readonly FormWizardDialogStep[]; activeStep: string; onStepChange: (step: string) => void; children: React.ReactNode; onSubmit: () => void | Promise<void>; onCancel?: () => void; isPending?: boolean; submitLabel?: React.ReactNode; cancelLabel?: string; error?: React.ReactNode; className?: string; }

export function FormWizardDialog({ open, onOpenChange, title, headerIcon: HeaderIcon, description, steps, activeStep, onStepChange, children, onSubmit, onCancel, isPending = false, submitLabel = 'Save changes', cancelLabel = 'Cancel', error, className }: FormWizardDialogProps) {
  const index = steps.findIndex((step) => step.id === activeStep);
  const previous = index > 0 ? steps[index - 1] : undefined;
  const next = index >= 0 && index < steps.length - 1 ? steps[index + 1] : undefined;
  const current = steps[index];
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className={cn('flex max-h-[90vh] max-w-5xl flex-col gap-0 overflow-hidden p-0', className)}><DialogHeader className="border-b px-6 py-4 text-start"><DialogTitle><FormHeaderTitle icon={HeaderIcon}>{title}</FormHeaderTitle></DialogTitle>{description ? <DialogDescription>{description}</DialogDescription> : null}</DialogHeader><div className="flex flex-wrap gap-2 border-b bg-muted/30 px-4 py-3" role="tablist" aria-label="Form sections">{steps.map((step) => <button key={step.id} type="button" role="tab" aria-selected={step.id === activeStep} onClick={() => onStepChange(step.id)} className={cn('rounded-md border px-3 py-1.5 text-xs font-medium', step.id === activeStep ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground')}>{step.label}{step.errorCount ? ` (${step.errorCount})` : ''}</button>)}</div><main className="min-h-0 flex-1 overflow-y-auto">{current ? <div className="border-b bg-muted/20 px-6 py-3"><h3 className="text-sm font-semibold">{current.label}</h3>{current.description ? <p className="text-xs text-muted-foreground">{current.description}</p> : null}</div> : null}<div className="space-y-4 p-6">{error ? <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{error}</div> : null}{children}</div></main><footer className="flex items-center justify-between border-t bg-card px-6 py-4"><div className="flex gap-2">{previous ? <Button type="button" variant="ghost" size="sm" onClick={() => onStepChange(previous.id)} disabled={isPending}>Previous</Button> : null}{next ? <Button type="button" variant="outline" size="sm" onClick={() => onStepChange(next.id)} disabled={isPending}>Next section</Button> : null}</div><div className="flex gap-2">{onCancel ? <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={isPending}>{cancelLabel}</Button> : null}<Button type="button" size="sm" onClick={() => void onSubmit()} disabled={isPending} loading={isPending}>{submitLabel}</Button></div></footer></DialogContent></Dialog>;
}
