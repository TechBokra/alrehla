import type { Table as TanStackTable } from "@tanstack/react-table";
import type { ResourceErrorState } from "../errors";

export type ResourceDensity = "compact" | "comfortable" | "spacious";

export type ResourceFormState<TData> =
  { mode: "closed" } | { mode: "create" } | { mode: "update"; record: TData };

export interface ResourcePendingState {
  create: boolean;
  update: boolean;
  delete: boolean;
  deleteMany: boolean;
  reorder: boolean;
  import: boolean;
}

export interface ResourceOperationErrors {
  create: ResourceErrorState | null;
  update: ResourceErrorState | null;
  delete: ResourceErrorState | null;
  deleteMany: ResourceErrorState | null;
  reorder: ResourceErrorState | null;
  import: ResourceErrorState | null;
}

export interface ResourceDeleteMutationAdapter<TData, TDeleteInput> {
  isPending: boolean;
  mutateAsync: (input: TDeleteInput) => Promise<unknown>;
  getInput: (record: TData) => TDeleteInput;
  getLabel?: (record: TData) => string;
}

export interface ResourceMutationAdapters<TData, TDeleteInput> {
  delete?: ResourceDeleteMutationAdapter<TData, TDeleteInput>;
}

export type ResourceTable<TData> = TanStackTable<TData> | null;
