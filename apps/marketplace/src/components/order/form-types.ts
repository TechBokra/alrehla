import type { AnyFormApi } from '@tanstack/react-form';

/**
 * The order form uses dynamic product fields, so the child components share
 * TanStack's intentionally broad API type while the page keeps the concrete
 * OrderFormValues type at its boundary.
 */
export type OrderFormApi = AnyFormApi & {
  Field: any;
  Subscribe: any;
};

export const getFieldError = (field: any): string | undefined => {
  const error = field?.state?.meta?.errors?.[0];
  if (!error) return undefined;
  return typeof error === 'string' ? error : error.message;
};

