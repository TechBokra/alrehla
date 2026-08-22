export interface FormSubmissionState {
  canSubmit: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  isValid: boolean;
  /** Alias for TanStack Form's `submissionAttempts` state field. */
  submitCount: number;
}

type FormStateWithSubmission = Omit<FormSubmissionState, 'submitCount'> & {
  submissionAttempts: number;
};

export const selectFormSubmissionState = (
  state: FormStateWithSubmission,
): FormSubmissionState => ({
  canSubmit: state.canSubmit,
  isDirty: state.isDirty,
  isSubmitting: state.isSubmitting,
  isValid: state.isValid,
  submitCount: state.submissionAttempts,
});
