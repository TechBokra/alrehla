"use client";

import { DeleteConfirmationDialog } from "@eng-mohamedelsayed/admin-ui/components/feedback/delete-confirmation-dialog";
import { FormDialog } from "../forms/form-dialog";
import { FormSheet } from "../forms/form-sheet";
import { useResource } from "@eng-mohamedelsayed/admin-core/resource";
import { ResourceFormRenderer } from "./resource-form-renderer";
import type {
  ResourceFormDefinition,
  ResourceFormsDefinition,
} from "./contracts";
import { ResourceErrorBanner } from "@eng-mohamedelsayed/admin-ui/components/feedback/resource-error-state";
import type {
  ResourceDefinition,
  ResourceListResult,
} from "@eng-mohamedelsayed/admin-core/resource";
import type { DataViewCsvRow } from "@eng-mohamedelsayed/admin-core/data-view";

export interface ResourceFormHostProps<
  TData,
  TCreateInput = never,
  TUpdateInput = never,
  TQueryRaw = ResourceListResult<TData>,
  TValue = unknown,
  TImport = DataViewCsvRow,
  TDeleteInput = string,
> {
  /** Type anchor for the form boundary; runtime state still comes from ResourceContext. */
  resource?: ResourceDefinition<
    TData,
    TCreateInput,
    TUpdateInput,
    TQueryRaw,
    TValue,
    TImport,
    TDeleteInput
  >;
}

function ActiveResourceForm<
  TData,
  TCreateInput,
  TUpdateInput,
  TQueryRaw,
  TValue,
  TImport,
  TDeleteInput,
>({
  resource,
}: ResourceFormHostProps<
  TData,
  TCreateInput,
  TUpdateInput,
  TQueryRaw,
  TValue,
  TImport,
  TDeleteInput
>) {
  const { definition, formState, closeForm, actions, pending, errors } =
    useResource<
      TData,
      TCreateInput,
      TUpdateInput,
      TQueryRaw,
      TValue,
      TImport,
      TDeleteInput
    >();
  void resource;
  if (formState.mode === "closed") return null;

  const forms = definition.forms as
    | ResourceFormsDefinition<TData, TCreateInput, TUpdateInput>
    | undefined;

  const mode = formState.mode;

  function renderForm<TValues>(
    formDefinition: ResourceFormDefinition<TData, TValues>,
    record: TData | undefined,
    onSubmit: (values: TValues) => void | Promise<unknown>
  ) {
    const presentation =
      formDefinition.mode ?? formDefinition.presentation ?? "dialog";
    if (presentation === "page") return null;

    const Icon = definition.metadata.icon;
    const title =
      typeof formDefinition.title === "function"
        ? formDefinition.title({ mode, ...(record ? { record } : {}) })
        : (formDefinition.title ??
          `${mode === "create" ? "Create" : "Edit"} ${definition.metadata.singularLabel}`);
    const description =
      typeof formDefinition.description === "function"
        ? formDefinition.description({ mode, ...(record ? { record } : {}) })
        : (formDefinition.description ?? definition.metadata.description);
    const onOpenChange = (open: boolean) => {
      if (!open) closeForm();
    };
    const isPending = mode === "create" ? pending.create : pending.update;
    const operationError = mode === "create" ? errors.create : errors.update;
    const content = (
      <>
        <ResourceErrorBanner state={operationError} />
        {"component" in formDefinition ? (
          <formDefinition.component
            mode={mode}
            record={record}
            open
            title={title}
            {...(description ? { description } : {})}
            {...(Icon ? { icon: Icon } : {})}
            onOpenChange={onOpenChange}
            onClose={closeForm}
            onSubmit={onSubmit}
            isPending={isPending}
            pending={isPending}
          />
        ) : (
          <ResourceFormRenderer
            definition={formDefinition}
            mode={mode}
            {...(record ? { record } : {})}
            onSubmit={onSubmit}
            onCancel={closeForm}
            pending={isPending}
            id={`${definition.metadata.name}-${mode}-form`}
          />
        )}
      </>
    );

    if (
      "component" in formDefinition &&
      (presentation === "wizard" || formDefinition.managesPresentation)
    ) {
      return content;
    }

    if (presentation === "sheet") {
      return (
        <FormSheet
          open
          onOpenChange={onOpenChange}
          title={title}
          {...(Icon ? { icon: Icon } : {})}
          {...(description ? { description } : {})}
          size="full"
        >
          {content}
        </FormSheet>
      );
    }

    return (
      <FormDialog
        open
        onOpenChange={onOpenChange}
        title={title}
        {...(Icon ? { icon: Icon } : {})}
        {...(description ? { description } : {})}
      >
        {content}
      </FormDialog>
    );
  }

  if (mode === "create") {
    const formDefinition = forms?.create;
    if (!formDefinition) return null;
    return renderForm(formDefinition, undefined, async (values) => {
      await actions.create(values);
      closeForm();
    });
  }

  const formDefinition = forms?.update;
  if (!formDefinition) return null;
  return renderForm(formDefinition, formState.record, async (values) => {
    await actions.update(formState.record, values);
    closeForm();
  });
}

function ResourceDeleteHost() {
  const {
    definition,
    mutations,
    actions,
    pending,
    errors,
    deleteRecord,
    closeDelete,
  } = useResource();
  const deleteDefinition = definition.mutations?.delete;
  const deleteMutation = mutations?.delete;
  if ((!deleteDefinition && !deleteMutation) || !deleteRecord) return null;

  const entityName =
    deleteDefinition?.getLabel?.(deleteRecord) ??
    deleteMutation?.getLabel?.(deleteRecord) ??
    definition.metadata.singularLabel;

  return (
    <DeleteConfirmationDialog
      open
      onOpenChange={(open) => {
        if (!open && !(deleteMutation?.isPending ?? pending.delete))
          closeDelete();
      }}
      entityName={entityName}
      loading={pending.delete || Boolean(deleteMutation?.isPending)}
      errorState={errors.delete}
      onConfirm={() => {
        const task = deleteDefinition
          ? actions.delete(deleteRecord)
          : deleteMutation
            ? deleteMutation.mutateAsync(deleteMutation.getInput(deleteRecord))
            : Promise.resolve();
        void task.then(closeDelete).catch(() => undefined);
      }}
    />
  );
}

/** Renders only the active form presentation and delete confirmation. */
export function ResourceFormHost<
  TData = never,
  TCreateInput = never,
  TUpdateInput = never,
  TQueryRaw = ResourceListResult<TData>,
  TValue = unknown,
  TImport = DataViewCsvRow,
  TDeleteInput = string,
>(
  props: ResourceFormHostProps<
    TData,
    TCreateInput,
    TUpdateInput,
    TQueryRaw,
    TValue,
    TImport,
    TDeleteInput
  > = {}
) {
  return (
    <>
      <ActiveResourceForm {...props} />
      <ResourceDeleteHost />
    </>
  );
}
