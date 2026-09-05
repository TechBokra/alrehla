/**
 * Serializable form contracts shared by resource definitions.
 *
 * Admin Core deliberately has no knowledge of React, TanStack Form, field
 * components, runtime registries, or domain-specific controls. Admin Forms
 * owns the runtime representation used to render these definitions.
 */

export type ResourceFormSchema = unknown;

/** String identifiers are persisted in resource definitions and resolved by Admin Forms. */
export type ResourceFieldIdentifier = string;

/** String paths keep the resource package independent from a form engine. */
export type DeepKeys<T> = string;
export type DeepValue<T, TPath extends string> = unknown;

export type ResourceFormMode = "create" | "update";
export type ResourceFormPresentation = "dialog" | "sheet" | "wizard" | "page";

/** Serializable ownership metadata used for section-level error navigation. */
export interface FormSectionOwnership {
  id: string;
  fields?: readonly string[];
  fieldPrefixes?: readonly string[];
}

export interface ResourceFormSectionOwnership {
  fields?: readonly string[];
  fieldPrefixes?: readonly string[];
}

/**
 * A field definition contains only data. The `field` identifier and `props`
 * are interpreted by the Admin Forms runtime registry.
 */
export interface ResourceFormField<TData = unknown, TValues = unknown> {
  id?: string;
  name: DeepKeys<TValues>;
  field: ResourceFieldIdentifier;
  label?: string;
  description?: string;
  required?: boolean;
  colSpan?: 1 | 2 | 3 | 4;
  props?: Record<string, unknown>;
}

export interface ResourceFormSection<TData = unknown, TValues = unknown> {
  id: string;
  title?: string;
  description?: string;
  columns?: 1 | 2 | 3 | 4;
  fields?: readonly ResourceFormField<TData, TValues>[];
  ownership?: ResourceFormSectionOwnership;
}

export interface ResourceFormStep<TData = unknown, TValues = unknown>
  extends ResourceFormSection<TData, TValues> {
  title: string;
}

export interface ResourceFormDefinition<TData = unknown, TValues = unknown> {
  mode?: ResourceFormPresentation;
  presentation?: ResourceFormPresentation;
  title?: string;
  description?: string;
  submitLabel?: string;
  defaultValues?: TValues;
  schema?: ResourceFormSchema;
  fields?: readonly ResourceFormField<TData, TValues>[];
  sections?: readonly ResourceFormSection<TData, TValues>[];
  steps?: readonly ResourceFormStep<TData, TValues>[];
  [key: string]: unknown;
}

export interface ResourceFormsDefinition<
  TData = unknown,
  TCreateInput = unknown,
  TUpdateInput = unknown,
> {
  create?: ResourceFormDefinition<TData, TCreateInput>;
  update?: ResourceFormDefinition<TData, TUpdateInput>;
}

/** Derive section ownership from serializable field names and explicit prefixes. */
export function getResourceFormSectionOwnership<TData, TValues>(
  section: ResourceFormSection<TData, TValues>
): FormSectionOwnership {
  const inferredFields = (section.fields ?? []).map((field) => String(field.name));
  const explicitFields = section.ownership?.fields ?? [];
  const fields = [...new Set([...inferredFields, ...explicitFields])];
  const fieldPrefixes = [...new Set(section.ownership?.fieldPrefixes ?? [])];

  return {
    id: section.id,
    ...(fields.length > 0 ? { fields } : {}),
    ...(fieldPrefixes.length > 0 ? { fieldPrefixes } : {}),
  };
}

export function getResourceFormSectionsOwnership<TData, TValues>(
  sections: readonly ResourceFormSection<TData, TValues>[]
) {
  return sections.map((section) => getResourceFormSectionOwnership(section));
}

/** Backwards-compatible plural helper for serializable section metadata. */
export function getResourceFormOwnership<TData, TValues>(
  sections: readonly ResourceFormSection<TData, TValues>[]
) {
  return getResourceFormSectionsOwnership(sections);
}
