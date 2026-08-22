import type { z } from 'zod';
import { revalidateLogic } from '@tanstack/react-form';

export type ZodFormSchema<TValues> = z.ZodType<TValues, z.ZodTypeDef, TValues>;

export type InferFormValues<TSchema extends z.ZodTypeAny> = z.infer<TSchema>;

export const zodFormValidators = <TValues>(schema: ZodFormSchema<TValues>) => ({
  // Keep untouched forms quiet, then revalidate the whole schema as soon as a
  // user edits after a failed submit.
  onDynamic: schema,
  onBlur: schema,
  onSubmit: schema,
});

export const zodFormOptions = <TValues>(schema: ZodFormSchema<TValues>) => ({
  validators: zodFormValidators(schema),
  validationLogic: revalidateLogic({
    mode: 'submit',
    modeAfterSubmission: 'change',
  }),
});
