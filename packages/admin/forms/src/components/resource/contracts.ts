import type * as React from "react";
import type {
  ResourceFieldIdentifier,
  ResourceFormMode,
  ResourceFormPresentation,
  ResourceFormSchema,
  ResourceFormSectionOwnership,
} from "@eng-mohamedelsayed/admin-core/resource";

export type {
  ResourceFieldIdentifier,
  ResourceFormMode,
  ResourceFormPresentation,
  ResourceFormSchema,
  ResourceFormSectionOwnership,
};

export interface ResourceFormInstance<TValues> {
  state: {
    values: TValues;
    errorMap: Record<string, unknown>;
    fieldMeta: Record<string, { errors?: readonly unknown[] }>;
  };
  AppField: <TName extends string>(props: {
    name: TName;
    children: (field: ResourceFieldComponentMap) => React.ReactNode;
  }) => React.ReactNode;
  Subscribe: <TSelected>(props: {
    selector: (state: ResourceFormInstance<TValues>["state"]) => TSelected;
    children: (selected: TSelected) => React.ReactNode;
  }) => React.ReactNode;
  setFieldValue: (name: string, value: unknown) => void;
  reset: (values: TValues) => void;
  handleSubmit: () => unknown;
  FormActions: React.ComponentType<Record<string, unknown>>;
  AppForm: React.ComponentType<{ children?: React.ReactNode }>;
}

export interface ResourceFormFieldContext<TData, TValues> {
  form: ResourceFormInstance<TValues>;
  mode: ResourceFormMode;
  record?: TData;
  pending?: boolean;
}

export type ResourceRegisteredFieldProps = Record<string, unknown>;

/**
 * Field callbacks expose the generic registry contract to app-owned custom
 * forms. Explicit built-ins stay non-optional under noUncheckedIndexedAccess;
 * the index signature leaves room for composed domain extensions.
 */
export interface ResourceFieldComponentMap {
  Input: React.ComponentType<any>;
  Textarea: React.ComponentType<any>;
  Number: React.ComponentType<any>;
  Order: React.ComponentType<any>;
  Rank: React.ComponentType<any>;
  Select: React.ComponentType<any>;
  Combobox: React.ComponentType<any>;
  Checkbox: React.ComponentType<any>;
  CheckboxGroup: React.ComponentType<any>;
  StringList: React.ComponentType<any>;
  Switch: React.ComponentType<any>;
  RadioGroup: React.ComponentType<any>;
  Date: React.ComponentType<any>;
  DateTime: React.ComponentType<any>;
  DateRange: React.ComponentType<any>;
  Color: React.ComponentType<any>;
  Tags: React.ComponentType<any>;
  RichText: React.ComponentType<any>;
  Slug: React.ComponentType<any>;
  Link: React.ComponentType<any>;
  ParentPicker: React.ComponentType<any>;
  ImageUpload: React.ComponentType<any>;
  MultiImageUpload: React.ComponentType<any>;
  FileUpload: React.ComponentType<any>;
  Translation: React.ComponentType<any>;
  Metadata: React.ComponentType<any>;
  [name: string]: React.ComponentType<any>;
}

export interface ResourceRegisteredFormField<TData, TValues> {
  name: string;
  field: ResourceFieldIdentifier;
  label?: React.ReactNode;
  description?: React.ReactNode;
  required?: boolean;
  hidden?: (context: { values: TValues; record?: TData }) => boolean;
  colSpan?: 1 | 2 | 3 | 4;
  props?: ResourceRegisteredFieldProps;
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

export interface ResourceFormComponentProps<TData, TValues = unknown> {
  mode: ResourceFormMode;
  record: TData | undefined;
  open: boolean;
  title: string;
  description?: string;
  icon?: React.ElementType<{ className?: string }>;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  onSubmit: (values: TValues) => void | Promise<unknown>;
  initialValues?: TValues;
  isPending?: boolean;
  pending?: boolean;
  error?: Error | null;
}

interface ResourceFormDefinitionBase<TData, TValues> {
  mode?: ResourceFormPresentation;
  presentation?: ResourceFormPresentation;
  href?: (context: { mode: ResourceFormMode; record?: TData }) => string;
  title?:
    | string
    | ((context: { mode: ResourceFormMode; record?: TData }) => string);
  description?:
    | string
    | ((context: { mode: ResourceFormMode; record?: TData }) => string);
  submitLabel?: string;
  defaultValues?: TValues;
  getDefaultValues?: (context: {
    mode: ResourceFormMode;
    record?: TData;
  }) => TValues;
  schema?: ResourceFormSchema;
}

export interface ResourceCustomFormDefinition<TData, TValues = unknown>
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
  managesPresentation?: never;
  sections?: never;
  steps?: never;
}

export interface ResourceSectionsFormDefinition<TData, TValues>
  extends ResourceFormDefinitionBase<TData, TValues> {
  schema: ResourceFormSchema;
  sections: readonly ResourceFormSection<TData, TValues>[];
  component?: never;
  managesPresentation?: never;
  fields?: never;
  steps?: never;
}

export interface ResourceStepsFormDefinition<TData, TValues>
  extends ResourceFormDefinitionBase<TData, TValues> {
  mode: "wizard";
  schema: ResourceFormSchema;
  steps: readonly ResourceFormStep<TData, TValues>[];
  component?: never;
  managesPresentation?: never;
  fields?: never;
  sections?: never;
}

export interface ResourcePageFormDefinition<TData, TValues = unknown>
  extends ResourceFormDefinitionBase<TData, TValues> {
  mode: "page";
  href: (context: { mode: ResourceFormMode; record?: TData }) => string;
  component?: never;
  managesPresentation?: never;
  fields?: never;
  sections?: never;
  steps?: never;
}

export type ResourceFormDefinition<TData, TValues = unknown> =
  | ResourceFieldsFormDefinition<TData, TValues>
  | ResourceSectionsFormDefinition<TData, TValues>
  | ResourceStepsFormDefinition<TData, TValues>
  | ResourceCustomFormDefinition<TData, TValues>
  | ResourcePageFormDefinition<TData, TValues>;

export interface ResourceFormsDefinition<
  TData,
  TCreateInput = unknown,
  TUpdateInput = unknown,
> {
  create?: ResourceFormDefinition<TData, TCreateInput>;
  update?: ResourceFormDefinition<TData, TUpdateInput>;
}
