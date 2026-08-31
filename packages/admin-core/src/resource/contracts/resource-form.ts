import type * as React from 'react';

/** Admin Core keeps schemas opaque; @alrehla/forms owns validation/runtime. */
export type ResourceFormSchema = unknown;
export type DeepKeys<T> = string;
export type DeepValue<T, TPath extends string> = unknown;
export type ResourceFormMode = 'create' | 'update';
export type ResourceFormPresentation = 'dialog' | 'sheet' | 'wizard' | 'page';

export interface FormSectionOwnership {
  id: string;
  fields?: readonly string[];
  fieldPrefixes?: readonly string[];
}

export interface ResourceFormSectionOwnership {
  fields?: readonly string[];
  fieldPrefixes?: readonly string[];
}

export interface ResourceFormComponentProps<TData, TValues = unknown> {
  mode: ResourceFormMode;
  record: TData | undefined;
  open: boolean;
  title: string;
  description?: string;
  icon?: React.ElementType<{ className?: string }>;
  onOpenChange(open: boolean): void;
  onClose(): void;
  onSubmit(values: TValues): void | Promise<unknown>;
  initialValues?: TValues;
  isPending?: boolean;
  pending?: boolean;
  error?: Error | null;
}

/** Headless bridge; @alrehla/forms supplies the concrete form instance. */
export interface ResourceFormInstance<TValues> {
  state: {
    values: TValues;
    errorMap: Record<string, unknown>;
    fieldMeta: Record<string, { errors?: readonly unknown[] }>;
  };
  AppField: <TName extends DeepKeys<TValues>>(props: {
    name: TName;
    children: (field: ResourceRegisteredFieldComponents) => React.ReactNode;
  }) => React.ReactNode;
  Subscribe: <TSelected>(props: {
    selector: (state: ResourceFormInstance<TValues>['state']) => TSelected;
    children: (selected: TSelected) => React.ReactNode;
  }) => React.ReactNode;
  setFieldValue<TName extends DeepKeys<TValues>>(
    name: TName,
    value: DeepValue<TValues, TName>,
  ): void;
  reset(values: TValues): void;
  handleSubmit(): unknown;
  FormActions: React.ComponentType<Record<string, unknown>>;
}

export interface ResourceFormFieldContext<TData, TValues> {
  form: ResourceFormInstance<TValues>;
  mode: ResourceFormMode;
  record?: TData;
  pending?: boolean;
}

export type ResourceRegisteredFieldName =
  | 'Input'
  | 'Combobox'
  | 'CheckboxGroup'
  | 'StringList'
  | 'RadioGroup'
  | 'Tags'
  | 'RichText'
  | 'Slug'
  | 'CategoryPicker'
  | 'CollectionPicker'
  | 'ParentPicker'
  | 'ImageUpload'
  | 'Translation'
  | 'Metadata'
  | 'Text'
  | 'Textarea'
  | 'Number'
  | 'Select'
  | 'Checkbox'
  | 'Switch'
  | 'Date'
  | 'Time';

export type ResourceRegisteredFieldProps = {
  [TField in ResourceRegisteredFieldName]: Record<string, unknown>;
};

export type ResourceRegisteredFieldComponents = {
  [TField in ResourceRegisteredFieldName]: React.ComponentType<
    ResourceRegisteredFieldProps[TField]
  >;
};

export interface ResourceRegisteredFormField<TData, TValues> {
  field: ResourceRegisteredFieldName;
  name: string;
  label?: React.ReactNode;
  description?: React.ReactNode;
  required?: boolean;
  hidden?: (context: { values: TValues; record?: TData }) => boolean;
  colSpan?: 1 | 2 | 3 | 4;
  props?: Record<string, unknown>;
}

export interface ResourceCustomFormField<TData, TValues> {
  id: string;
  component: React.ComponentType<ResourceFormFieldContext<TData, TValues>>;
  hidden?: (context: { values: TValues; record?: TData }) => boolean;
  colSpan?: 1 | 2 | 3 | 4;
}

export type ResourceFormField<TData, TValues> =
  | ResourceRegisteredFormField<TData, TValues>
  | ResourceCustomFormField<TData, TValues>;

export interface ResourceFormSection<TData, TValues> {
  id: string;
  title?: string;
  description?: string;
  columns?: 1 | 2 | 3 | 4;
  fields?: readonly ResourceFormField<TData, TValues>[];
  ownership?: ResourceFormSectionOwnership;
  component?: React.ComponentType<ResourceFormFieldContext<TData, TValues>>;
}

export interface ResourceFormStep<TData, TValues>
  extends ResourceFormSection<TData, TValues> {
  title: string;
}

interface ResourceFormDefinitionBase<TData, TValues> {
  mode?: ResourceFormPresentation;
  presentation?: ResourceFormPresentation;
  href?: (context: { mode: ResourceFormMode; record?: TData }) => string;
  title?: string | ((context: { mode: ResourceFormMode; record?: TData }) => string);
  description?: string | ((context: { mode: ResourceFormMode; record?: TData }) => string);
  submitLabel?: string;
  defaultValues?: TValues;
  getDefaultValues?: (context: { mode: ResourceFormMode; record?: TData }) => TValues;
  schema?: ResourceFormSchema;
}

export interface ResourceCustomFormDefinition<TData, TValues>
  extends ResourceFormDefinitionBase<TData, TValues> {
  component: React.ComponentType<ResourceFormComponentProps<TData, TValues>>;
  managesPresentation?: boolean;
  fields?: never;
  sections?: never;
  steps?: never;
}

export interface ResourceFieldsFormDefinition<TData, TValues>
  extends ResourceFormDefinitionBase<TData, TValues> {
  schema: ResourceFormSchema;
  fields: readonly ResourceFormField<TData, TValues>[];
  component?: never;
  sections?: never;
  steps?: never;
}

export interface ResourceSectionsFormDefinition<TData, TValues>
  extends ResourceFormDefinitionBase<TData, TValues> {
  schema: ResourceFormSchema;
  sections: readonly ResourceFormSection<TData, TValues>[];
  component?: never;
  fields?: never;
  steps?: never;
}

export interface ResourceStepsFormDefinition<TData, TValues>
  extends ResourceFormDefinitionBase<TData, TValues> {
  mode: 'wizard';
  schema: ResourceFormSchema;
  steps: readonly ResourceFormStep<TData, TValues>[];
  component?: never;
  fields?: never;
  sections?: never;
}

export interface ResourcePageFormDefinition<TData, TValues>
  extends ResourceFormDefinitionBase<TData, TValues> {
  mode: 'page';
  href(context: { mode: ResourceFormMode; record?: TData }): string;
  component?: never;
  fields?: never;
  sections?: never;
  steps?: never;
}

export type ResourceFormDefinition<TData, TValues> =
  | ResourceCustomFormDefinition<TData, TValues>
  | ResourceFieldsFormDefinition<TData, TValues>
  | ResourceSectionsFormDefinition<TData, TValues>
  | ResourceStepsFormDefinition<TData, TValues>
  | ResourcePageFormDefinition<TData, TValues>;

export interface ResourceFormsDefinition<TData, TCreateInput, TUpdateInput> {
  create?: ResourceFormDefinition<TData, TCreateInput>;
  update?: ResourceFormDefinition<TData, TUpdateInput>;
}

export function getResourceFormSectionOwnership<TData, TValues>(
  section: ResourceFormSection<TData, TValues>,
): FormSectionOwnership {
  const inferredFields = (section.fields ?? [])
    .filter(
      (field): field is ResourceRegisteredFormField<TData, TValues> => 'name' in field,
    )
    .map((field) => field.name);
  const fields = [...new Set([...inferredFields, ...(section.ownership?.fields ?? [])])];
  const fieldPrefixes = [...new Set(section.ownership?.fieldPrefixes ?? [])];
  return {
    id: section.id,
    ...(fields.length ? { fields } : {}),
    ...(fieldPrefixes.length ? { fieldPrefixes } : {}),
  };
}

export const getResourceFormOwnership = <TData, TValues>(
  sections: readonly ResourceFormSection<TData, TValues>[],
) => sections.map((section) => getResourceFormSectionOwnership(section));
