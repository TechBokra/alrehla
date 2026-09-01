'use client';

import * as React from 'react';
import type { FormSubmitStateProps, FormSubmitStateValue } from './types';

export const resolveFormSubmitState = (
  formState: Pick<FormSubmitStateValue, 'isDirty' | 'isTouched' | 'canSubmit'> & { isSubmitting: boolean },
  pending = false,
  status?: FormSubmitStateValue['status'],
): FormSubmitStateValue => ({
  status: status ?? (pending ? 'pending' : formState.isSubmitting ? 'submitting' : 'idle'),
  isPending: pending || formState.isSubmitting,
  isDirty: formState.isDirty,
  isTouched: formState.isTouched,
  canSubmit: formState.canSubmit,
  hasUnsavedChanges: formState.isDirty,
});

export function FormSubmitState<TValues>({ form, pending = false, status, children }: FormSubmitStateProps<TValues>) {
  return (
    <form.Subscribe
      selector={(state) => resolveFormSubmitState({
        isSubmitting: state.isSubmitting,
        isDirty: state.isDirty,
        isTouched: state.isTouched,
        canSubmit: state.canSubmit,
      }, pending, status)}
    >
      {(selected) => children({
        ...selected,
        status: status ?? (pending ? 'pending' : form.coreStatus ?? selected.status),
      })}
    </form.Subscribe>
  );
}
