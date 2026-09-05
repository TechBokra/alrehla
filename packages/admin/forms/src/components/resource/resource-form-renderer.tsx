"use client";

import * as React from "react";
import {
  applyServerFieldErrors,
  normalizeMutationError,
} from "@eng-mohamedelsayed/mutations/utils";
import {
  CoreForm,
  CoreFormError,
  type CoreFormValidatorMap,
  FormGrid,
  FormSection,
  FormWizard,
  useCoreForm,
} from "../forms";
import type {
  ResourceFormDefinition,
  ResourceFormField,
  ResourceFormMode,
  ResourceFormSection,
  ResourceFormInstance,
} from "./contracts";
import type { FormSectionOwnership } from "@eng-mohamedelsayed/admin-core/resource";
import type { ResourceFormRuntimeMetadata } from "@eng-mohamedelsayed/admin-core/resource";

export interface ResourceFormRendererProps<TData, TValues> {
  definition:
    | ResourceFormDefinition<TData, TValues>
    | ResourceFormRuntimeMetadata<TData, TValues>;
  mode: ResourceFormMode;
  record?: TData;
  onSubmit: (values: TValues) => void | Promise<unknown>;
  onCancel: () => void;
  pending?: boolean;
  id?: string;
}

function fieldSpanClass(
  colSpan: 1 | 2 | 3 | 4 | undefined
): string | undefined {
  if (!colSpan || colSpan === 1) return undefined;
  return colSpan === 2
    ? "md:col-span-2"
    : colSpan === 3
      ? "md:col-span-3"
      : "md:col-span-4";
}

function fieldProps<TData, TValues>(
  field: Extract<ResourceFormField<TData, TValues>, { field: string }>
) {
  return {
    ...(field.props ?? {}),
    ...(field.label !== undefined ? { label: field.label } : {}),
    ...(field.description !== undefined
      ? { description: field.description }
      : {}),
    ...(field.required !== undefined ? { required: field.required } : {}),
  };
}

function getRuntimeSectionOwnership<TData, TValues>(
  section: ResourceFormSection<TData, TValues>
): FormSectionOwnership {
  const fields = (section.fields ?? []).flatMap((field) =>
    "name" in field ? [String(field.name)] : []
  );
  const explicitFields = section.ownership?.fields ?? [];
  const allFields = [...new Set([...fields, ...explicitFields])];
  const fieldPrefixes = [...new Set(section.ownership?.fieldPrefixes ?? [])];

  return {
    id: section.id,
    ...(allFields.length > 0 ? { fields: allFields } : {}),
    ...(fieldPrefixes.length > 0 ? { fieldPrefixes } : {}),
  };
}

/** Default missing-field behavior preserves the previous renderer contract. */
export function MissingResourceField({
  field,
}: {
  field: string;
  name: string;
}) {
  void field;
  return null;
}

function RegisteredResourceField<TData, TValues>({
  form,
  definition,
  record,
}: {
  form: ResourceFormInstance<TValues>;
  definition: Extract<ResourceFormField<TData, TValues>, { field: string }>;
  record?: TData;
}) {
  const hiddenContext = record
    ? { values: form.state.values, record }
    : { values: form.state.values };
  if (definition.hidden?.(hiddenContext)) return null;

  return (
    <div className={fieldSpanClass(definition.colSpan)}>
      <form.AppField name={definition.name}>
        {(field) => {
          const FieldComponent = field[definition.field] as
            | React.ComponentType<Record<string, unknown>>
            | undefined;
          if (!FieldComponent) {
            return (
              <MissingResourceField
                field={definition.field}
                name={String(definition.name)}
              />
            );
          }
          return <FieldComponent {...fieldProps(definition)} />;
        }}
      </form.AppField>
    </div>
  );
}

function ResourceField<TData, TValues>({
  form,
  definition,
  mode,
  record,
  pending,
}: {
  form: ResourceFormInstance<TValues>;
  definition: ResourceFormField<TData, TValues>;
  mode: ResourceFormMode;
  record?: TData;
  pending: boolean;
}) {
  if ("component" in definition) {
    const hiddenContext = record
      ? { values: form.state.values, record }
      : { values: form.state.values };
    if (definition.hidden?.(hiddenContext)) return null;
    const Component = definition.component;
    return (
      <div className={fieldSpanClass(definition.colSpan)}>
        <Component
          form={form}
          mode={mode}
          pending={pending}
          {...(record ? { record } : {})}
        />
      </div>
    );
  }

  return (
    <RegisteredResourceField
      form={form}
      definition={definition}
      {...(record ? { record } : {})}
    />
  );
}

function ResourceSection<TData, TValues>({
  form,
  section,
  mode,
  record,
  pending,
}: {
  form: ResourceFormInstance<TValues>;
  section: ResourceFormSection<TData, TValues>;
  mode: ResourceFormMode;
  record?: TData;
  pending: boolean;
}) {
  const content = (
    <>
      {section.component ? (
        <section.component
          form={form}
          mode={mode}
          pending={pending}
          {...(record ? { record } : {})}
        />
      ) : null}
      {section.fields && section.fields.length > 0 ? (
        <FormGrid columns={section.columns ?? 1}>
          {section.fields.map((field) => (
            <ResourceField
              key={"id" in field ? field.id : `${field.field}-${field.name}`}
              form={form}
              definition={field}
              mode={mode}
              pending={pending}
              {...(record ? { record } : {})}
            />
          ))}
        </FormGrid>
      ) : null}
    </>
  );

  if (!section.title && !section.description) return content;
  return (
    <FormSection
      {...(section.title ? { title: section.title } : {})}
      {...(section.description ? { description: section.description } : {})}
    >
      {content}
    </FormSection>
  );
}

function ResourceFormContent<TData, TValues>({
  form,
  definition,
  mode,
  record,
  pending,
}: {
  form: ResourceFormInstance<TValues>;
  definition: ResourceFormDefinition<TData, TValues>;
  mode: ResourceFormMode;
  record?: TData;
  pending: boolean;
}) {
  if ("steps" in definition) {
    return (
      <FormWizard
        steps={definition.steps.map((step) => {
          const ownership = getRuntimeSectionOwnership<TData, TValues>(step);
          return {
            ...ownership,
            title: step.title,
            ...(step.description ? { description: step.description } : {}),
            content: (
              <ResourceSection<TData, TValues>
                form={form}
                section={step}
                mode={mode}
                pending={pending}
                {...(record ? { record } : {})}
              />
            ),
          };
        })}
        isSubmitting={pending}
        onComplete={async () => {
          await Promise.resolve(form.handleSubmit());
        }}
      />
    );
  }

  if ("sections" in definition) {
    return (
      <div className="space-y-5">
        {definition.sections.map((section) => (
          <ResourceSection
            key={section.id}
            form={form}
            section={section}
            mode={mode}
            pending={pending}
            {...(record ? { record } : {})}
          />
        ))}
      </div>
    );
  }

  if ("fields" in definition) {
    return (
      <FormGrid columns={2}>
        {definition.fields.map((field) => (
          <ResourceField
            key={"id" in field ? field.id : `${field.field}-${field.name}`}
            form={form}
            definition={field}
            mode={mode}
            pending={pending}
            {...(record ? { record } : {})}
          />
        ))}
      </FormGrid>
    );
  }

  return null;
}

export function ResourceFormRenderer<TData, TValues>({
  definition: rawDefinition,
  mode,
  record,
  onSubmit,
  onCancel,
  pending = false,
  id,
}: ResourceFormRendererProps<TData, TValues>) {
  const definition = rawDefinition as ResourceFormDefinition<TData, TValues>;
  if (!("schema" in definition) || definition.schema === undefined) {
    return null;
  }

  const defaultValues = React.useMemo(() => {
    if (definition.getDefaultValues) {
      return definition.getDefaultValues({
        mode,
        ...(record ? { record } : {}),
      });
    }
    if (definition.defaultValues !== undefined) return definition.defaultValues;
    throw new Error(
      `Resource ${mode} form requires defaultValues or getDefaultValues.`
    );
  }, [definition, mode, record]);

  const form = useCoreForm<TValues>({
    ...(id ? { formId: id } : {}),
    defaultValues,
    validators: {
      onSubmit: definition.schema as NonNullable<
        CoreFormValidatorMap<TValues>["onSubmit"]
      >,
    },
    syncInitialValues: true,
    onSubmit: async (values) => {
      await onSubmit(values);
    },
    onSubmitError: async (error, currentForm) => {
      applyServerFieldErrors(currentForm, normalizeMutationError(error));
    },
  });

  const resourceForm = form as unknown as ResourceFormInstance<TValues>;

  return (
    <CoreForm
      {...(id ? { id } : {})}
      form={form}
      pending={pending}
      className="space-y-5"
    >
      <CoreFormError form={form} />
      <ResourceFormContent
        form={resourceForm}
        definition={definition}
        mode={mode}
        {...(record ? { record } : {})}
        pending={pending}
      />
      {!("steps" in definition && definition.steps.length > 0) ? (
        <form.FormActions
          onCancel={onCancel}
          isPending={pending}
          submitLabel={definition.submitLabel ?? "Save"}
        />
      ) : null}
    </CoreForm>
  );
}
