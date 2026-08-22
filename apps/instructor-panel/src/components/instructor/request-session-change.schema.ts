import { z } from 'zod';

const scheduleConflictMessage =
  'عذراً، هذا الموعد محجوز للحجوزات التلقائية في جدولك الأساسي. يرجى اختيار موعد استثنائي خارج أوقات عملك المعتادة.';

export const requestSessionChangeSchema = z.object({
  newDate: z.string().min(1, 'يرجى اختيار الموعد الجديد.'),
  newTime: z.string().min(1, 'يرجى اختيار التوقيت.'),
  reason: z.string().trim().min(1, 'يرجى توضيح سبب طلب التغيير.'),
});

export type RequestSessionChangeInput = z.infer<typeof requestSessionChangeSchema>;

export const requestSessionChangeDefaultValues: RequestSessionChangeInput = {
  newDate: '',
  newTime: '',
  reason: '',
};

export const createRequestSessionChangeSchema = (
  hasScheduleConflict: (date: string, time: string) => boolean,
) =>
  requestSessionChangeSchema.superRefine((values, context) => {
    if (!values.newDate || !values.newTime) return;
    if (!hasScheduleConflict(values.newDate, values.newTime)) return;

    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: scheduleConflictMessage,
    });
  });
