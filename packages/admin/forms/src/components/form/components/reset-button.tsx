"use client";

import * as React from "react";
import { Button, type ButtonProps } from "@eng-mohamedelsayed/admin-ui/components/ui/button";
import { useFormContext } from "../context";

export interface ResetButtonProps extends ButtonProps {
  form?: any;
  children?: React.ReactNode;
}

export function ResetButton({
  form: formProp,
  children = "Reset",
  variant = "outline",
  disabled,
  onClick,
  ...props
}: ResetButtonProps) {
  const form = useFormContext(formProp);

  if (!form) {
    return (
      <Button type="button" variant={variant} disabled={disabled} onClick={onClick} {...props}>
        {children}
      </Button>
    );
  }

  return (
    <form.Subscribe selector={(state: any) => ({ isPristine: !state.isDirty, isSubmitting: state.isSubmitting })}>
      {({ isPristine, isSubmitting }: { isPristine: boolean; isSubmitting: boolean }) => (
        <Button
          type="button"
          variant={variant}
          disabled={disabled || isPristine || isSubmitting}
          onClick={(e) => {
            form.reset();
            onClick?.(e);
          }}
          {...props}
        >
          {children}
        </Button>
      )}
    </form.Subscribe>
  );
}
