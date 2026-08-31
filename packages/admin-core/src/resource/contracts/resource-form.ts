import type * as React from 'react';

export type ResourceFormMode = 'create' | 'update';
export type ResourceFormPresentation = 'dialog' | 'sheet' | 'page';

export interface ResourceFormComponentProps<TData, TValues> {
  mode: ResourceFormMode;
  record?: TData;
  open: boolean;
  title: string;
  description?: string;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  onSubmit: (values: TValues) => void | Promise<unknown>;
  isPending?: boolean;
}

export interface ResourceFormDefinition<TData, TValues> {
  mode?: ResourceFormPresentation;
  title?: string | ((context: { mode: ResourceFormMode; record?: TData }) => string);
  description?: string | ((context: { mode: ResourceFormMode; record?: TData }) => string);
  submitLabel?: string;
  defaultValues?: TValues;
  getDefaultValues?: (context: { mode: ResourceFormMode; record?: TData }) => TValues;
  href?: (context: { mode: ResourceFormMode; record?: TData }) => string;
  component?: React.ComponentType<ResourceFormComponentProps<TData, TValues>>;
  /** Form schemas and field configuration remain owned by @alrehla/forms/features. */
  schema?: unknown;
}

export interface ResourceFormsDefinition<TData, TCreateValues, TUpdateValues> {
  create?: ResourceFormDefinition<TData, TCreateValues>;
  update?: ResourceFormDefinition<TData, TUpdateValues>;
}
