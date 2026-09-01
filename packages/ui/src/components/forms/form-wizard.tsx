'use client';

import * as React from 'react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { FormActions } from './form-layout';

export interface FormWizardStep { id: string; title: string; description?: string; content: React.ReactNode; errorCount?: number; disabled?: boolean; }
export interface FormWizardProps { steps: readonly FormWizardStep[]; initialStep?: number; activeStep?: number; onStepChange?: (step: number) => void; canAdvance?: (step: FormWizardStep, nextStep: number) => boolean | Promise<boolean>; onComplete?: () => void | Promise<void>; isSubmitting?: boolean; className?: string; }

export function FormWizard({ steps, initialStep = 0, activeStep, onStepChange, canAdvance, onComplete, isSubmitting = false, className }: FormWizardProps) {
  const [uncontrolledStep, setUncontrolledStep] = React.useState(initialStep);
  const [advancing, setAdvancing] = React.useState(false);
  const step = activeStep ?? uncontrolledStep;
  const current = steps[step];
  if (!current) return null;
  const changeStep = (next: number) => { if (activeStep === undefined) setUncontrolledStep(next); onStepChange?.(next); };
  const handleNext = async () => { if (advancing) return; setAdvancing(true); try { if (step === steps.length - 1) { await onComplete?.(); return; } if ((await canAdvance?.(current, step + 1)) ?? true) changeStep(step + 1); } finally { setAdvancing(false); } };
  const progress = Math.round(((step + 1) / steps.length) * 100);
  return <section className={cn('space-y-6', className)} aria-label="Form wizard"><div className="space-y-3"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-medium">Step {step + 1} of {steps.length}</p><h2 className="text-xl font-semibold">{current.title}</h2>{current.description ? <p className="text-sm text-muted-foreground">{current.description}</p> : null}</div><span className="text-sm text-muted-foreground">{progress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div></div><nav aria-label="Wizard steps" className="flex flex-wrap gap-2">{steps.map((item, index) => <Button key={item.id} type="button" variant={index === step ? 'default' : 'outline'} size="sm" disabled={item.disabled || index > step || advancing || isSubmitting} onClick={() => changeStep(index)}>{index + 1}. {item.title}{item.errorCount ? ` (${item.errorCount})` : ''}</Button>)}</nav><div className="max-h-[min(60vh,48rem)] overflow-y-auto">{current.content}</div><FormActions align="between"><Button type="button" variant="outline" onClick={() => changeStep(step - 1)} disabled={step === 0 || advancing || isSubmitting}>Back</Button><Button type="button" onClick={() => void handleNext()} disabled={advancing || isSubmitting}>{step === steps.length - 1 ? (isSubmitting ? 'Submitting...' : 'Submit') : 'Next'}</Button></FormActions></section>;
}
