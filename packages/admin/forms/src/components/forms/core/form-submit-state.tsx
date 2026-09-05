"use client";

import * as React from "react";
import type { CoreFormRuntime } from "./types";

export interface FormSubmitStateProps<TForm = unknown> {
  form: TForm;
  pending?: boolean;
  children: (state: {
    isPending: boolean;
    isDirty: boolean;
    isTouched: boolean;
    canSubmit: boolean;
  }) => React.ReactNode;
}

export function FormSubmitState<TForm>({
  form,
  pending = false,
  children,
}: FormSubmitStateProps<TForm>) {
  const runtime = form as unknown as CoreFormRuntime;

  return (
    <runtime.Subscribe
      selector={(state) => ({
        isPending: pending || state.isSubmitting,
        isDirty: state.isDirty,
        isTouched: state.isTouched,
        canSubmit: state.canSubmit,
      })}
    >
      {children}
    </runtime.Subscribe>
  );
}
