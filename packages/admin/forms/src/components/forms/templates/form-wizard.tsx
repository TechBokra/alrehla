"use client";

import * as React from "react";
import type { FormSectionOwnership } from "@eng-mohamedelsayed/admin-core/resource";
import { cn } from "@eng-mohamedelsayed/admin-ui/lib/utils";
import { Button } from "@eng-mohamedelsayed/admin-ui/components/ui/button";
import { Progress } from "@eng-mohamedelsayed/admin-ui/components/ui/progress";
import { ScrollArea } from "@eng-mohamedelsayed/admin-ui/components/ui/scroll-area";
import { FormActions } from "../../form/components/form-actions";

export interface FormWizardStep extends FormSectionOwnership {
  title: string;
  description?: string;
  content: React.ReactNode;
}

export interface FormWizardProps {
  steps: readonly FormWizardStep[];
  initialStep?: number;
  activeStep?: number;
  onStepChange?: (step: number) => void;
  canAdvance?: (
    step: FormWizardStep,
    nextStep: number
  ) => boolean | Promise<boolean>;
  onComplete?: () => void | Promise<void>;
  isSubmitting?: boolean;
  className?: string;
}

export function FormWizard({
  steps,
  initialStep = 0,
  activeStep,
  onStepChange,
  canAdvance,
  onComplete,
  isSubmitting = false,
  className,
}: FormWizardProps) {
  const [uncontrolledStep, setUncontrolledStep] = React.useState(initialStep);
  const [isAdvancing, setIsAdvancing] = React.useState(false);
  const step = activeStep ?? uncontrolledStep;
  const current = steps[step];
  const isFirst = step === 0;
  const isLast = step === steps.length - 1;
  const progress = steps.length > 0 ? ((step + 1) / steps.length) * 100 : 0;

  const changeStep = (nextStep: number) => {
    if (activeStep === undefined) setUncontrolledStep(nextStep);
    onStepChange?.(nextStep);
  };

  const handleNext = async () => {
    if (!current || isAdvancing) return;
    setIsAdvancing(true);
    try {
      if (isLast) {
        await onComplete?.();
        return;
      }
      const allowed = (await canAdvance?.(current, step + 1)) ?? true;
      if (allowed) changeStep(step + 1);
    } finally {
      setIsAdvancing(false);
    }
  };

  if (!current) return null;

  return (
    <section className={cn("space-y-6", className)} aria-label="Form wizard">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium">
              Step {step + 1} of {steps.length}
            </p>
            <h2 className="text-xl font-semibold">{current.title}</h2>
            {current.description && (
              <p className="text-sm text-muted-foreground">
                {current.description}
              </p>
            )}
          </div>
          <span className="text-sm text-muted-foreground">
            {Math.round(progress)}%
          </span>
        </div>
        <Progress
          value={progress}
          aria-label={`${Math.round(progress)}% complete`}
        />
      </div>

      <nav aria-label="Wizard steps" className="hidden gap-2 md:flex">
        {steps.map((item, index) => (
          <Button
            key={item.id}
            type="button"
            variant={index === step ? "default" : "outline"}
            size="sm"
            disabled={index > step}
            onClick={() => changeStep(index)}
          >
            {index + 1}. {item.title}
          </Button>
        ))}
      </nav>

      <ScrollArea className="h-[min(60vh,48rem)]">
        <div className="pr-3">{current.content}</div>
      </ScrollArea>

      <FormActions align="between">
        <Button
          type="button"
          variant="outline"
          onClick={() => changeStep(step - 1)}
          disabled={isFirst || isAdvancing || isSubmitting}
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={() => void handleNext()}
          disabled={isAdvancing || isSubmitting}
        >
          {isLast ? (isSubmitting ? "Submitting..." : "Submit") : "Next"}
        </Button>
      </FormActions>
    </section>
  );
}
