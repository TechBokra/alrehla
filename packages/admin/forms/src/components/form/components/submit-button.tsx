"use client";

import * as React from "react";
import { Button, type ButtonProps } from "@eng-mohamedelsayed/admin-ui/components/ui/button";
import { useFormContext } from "../context";
import { Loader2 } from "lucide-react";

export interface SubmitButtonProps extends ButtonProps {
  form?: any;
  children?: React.ReactNode;
}

export function SubmitButton({
  form: formProp,
  children = "Save",
  disabled,
  className,
  ...props
}: SubmitButtonProps) {
  const form = useFormContext(formProp);

  if (!form) {
    return (
      <Button type="submit" disabled={disabled} className={className} {...props}>
        {children}
      </Button>
    );
  }

  return (
    <form.Subscribe
      selector={(state: any) => ({
        isSubmitting: state.isSubmitting,
        canSubmit: state.canSubmit,
      })}
    >
      {({ isSubmitting, canSubmit }: { isSubmitting: boolean; canSubmit: boolean }) => (
        <Button
          type="submit"
          disabled={disabled || isSubmitting || !canSubmit}
          className={className}
          {...props}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {children}
        </Button>
      )}
    </form.Subscribe>
  );
}
