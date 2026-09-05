import { describe, expect, it } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import type { DataViewState } from "../data-view/contracts";
import {
  createDataViewState,
  createResourceSelection,
  getDataViewTableState,
  resolveResourceView,
} from "../data-view/state";
import {
  resolveResourceCapabilities,
  type ResolvedResourceCapabilities,
} from "../resource/contracts/resource-capabilities";
import type {
  ResourceDefinition,
  ResourceListResult,
} from "../resource/contracts";
import type { ResourceQueryContext } from "../resource/contracts/resource-query";
import type { ResourceMutationExecutionContext } from "../resource/contracts/resource-mutation";
import { DEFAULT_RESOURCE_SCOPE, scopeResourceKey } from "../resource/scope";
import { normalizeAppError } from "@eng-mohamedelsayed/mutations/utils";
import {
  resolveResourceError,
  type ResourceErrorContext,
  type ResourceErrorOptions,
  type ResourceErrorState,
} from "../resource/errors";
import {
  authorizationAllows,
  authorizationPermissions,
  createResourceAuthorization,
  resolveResourceAccess,
  type ResourceAuthorization,
} from "../resource/authorization";
import {
  createResourceCacheTools,
  type ResourceCacheTools,
} from "../resource/cache";

export interface ResourceContractFixtures<
  TData,
  TCreateInput = unknown,
  TUpdateInput = unknown,
  TQueryRaw = ResourceListResult<TData>,
  TDeleteInput = string,
> {
  state?: DataViewState;
  storeA?: string;
  storeB?: string;
  query?: {
    response?: TQueryRaw;
    execute?: (context: ResourceQueryContext) => TQueryRaw | Promise<TQueryRaw>;
    error?: unknown;
  };
  mutations?: {
    createInput?: TCreateInput;
    update?: { record: TData; values: TUpdateInput };
    deleteInput?: TDeleteInput;
    deleteManyInput?: unknown;
    reorderInput?: unknown;
    importInput?: unknown;
  };
  forms?: {
    createValues?: TCreateInput;
    updateValues?: TUpdateInput;
    record?: TData;
  };
  rows?: readonly TData[];
  authorization?: {
    allow?: readonly string[];
    storeA?: readonly string[];
    storeB?: readonly string[];
    status?: "loading" | "ready" | "error" | "unavailable";
  };
}

export interface ResourceContractSections {
  scope?: boolean;
  cache?: boolean;
  query?: boolean;
  capabilities?: boolean;
  mutations?: boolean;
  forms?: boolean;
  dataView?: boolean;
  selection?: boolean;
  importExport?: boolean;
  hierarchy?: boolean;
  errors?: boolean;
}

export interface ResourceContractSuiteOptions<
  TData,
  TCreateInput = unknown,
  TUpdateInput = unknown,
  TQueryRaw = ResourceListResult<TData>,
  TValue = unknown,
  TImport = Record<string, string>,
  TDeleteInput = string,
> {
  definition: ResourceDefinition<
    TData,
    TCreateInput,
    TUpdateInput,
    TQueryRaw,
    TValue,
    TImport,
    TDeleteInput
  >;
  name?: string;
  fixtures?: ResourceContractFixtures<
    TData,
    TCreateInput,
    TUpdateInput,
    TQueryRaw,
    TDeleteInput
  >;
  sections?: ResourceContractSections;
}

export interface ResourceContractSuite<
  TData,
  TCreateInput = unknown,
  TUpdateInput = unknown,
  TQueryRaw = ResourceListResult<TData>,
  TValue = unknown,
  TImport = Record<string, string>,
  TDeleteInput = string,
> {
  definition: ResourceDefinition<
    TData,
    TCreateInput,
    TUpdateInput,
    TQueryRaw,
    TValue,
    TImport,
    TDeleteInput
  >;
  state: DataViewState;
  scope: {
    key: (storeId?: string) => readonly unknown[];
    mutationKey: (operation: string, storeId?: string) => readonly unknown[];
    invalidationKey: (
      queryKey: readonly unknown[],
      storeId?: string
    ) => readonly unknown[];
    assertIsolated: () => void;
  };
  query: {
    context: (storeId?: string) => ResourceQueryContext;
    key: (storeId?: string) => readonly unknown[];
    execute: (
      storeId?: string,
      signal?: AbortSignal
    ) => Promise<ResourceListResult<TData>>;
  };
  capabilities: (
    authorization?: ResourceAuthorization
  ) => ResolvedResourceCapabilities;
  authorization: {
    forStore: (
      storeId?: string,
      permissions?: readonly string[]
    ) => ResourceAuthorization;
  };
  cache: {
    tools: (storeId?: string) => ResourceCacheTools<TData>;
  };
  selection: {
    selectedCurrentPage: (
      rows: readonly TData[],
      rowSelection: Record<string, boolean>
    ) => TData[];
    preservesAcrossPages: boolean;
    unloadedRowsSupported: boolean;
    explicit: (
      rowSelection: Record<string, boolean>
    ) => ReturnType<typeof createResourceSelection>;
  };
  errors: {
    resolve: (
      error: unknown,
      context: ResourceErrorContext,
      options?: ResourceErrorOptions
    ) => ResourceErrorState | null;
    query: (error: unknown, hasData?: boolean) => ResourceErrorState | null;
    mutation: (
      error: unknown,
      context?: Exclude<ResourceErrorContext, "query" | "partial">
    ) => ResourceErrorState | null;
    partial: (
      succeededIds: string[],
      failedIds: string[]
    ) => ResourceErrorState | null;
  };
}

function resourceState(
  fixtures?: ResourceContractFixtures<any, any, any, any, any>
): DataViewState {
  return fixtures?.state ?? createDataViewState();
}

function queryBaseKey(
  definition: ResourceDefinition<any, any, any, any, any, any, any>,
  state: DataViewState,
  storeId?: string
) {
  const view = resolveResourceView(definition.views, state.activeView);
  return (
    definition.query?.queryKey({
      state,
      view: {
        id: view.id,
        type: view.type,
        config: view.config ?? {},
        state: state.viewState[view.id] ?? {},
      },
      ...(storeId ? { execution: { storeId } } : {}),
    }) ?? ["resource", definition.metadata.name, "disabled"]
  );
}

function expectedCapabilities(
  definition: ResourceDefinition<any, any, any, any, any, any, any>,
  authorization?: ResourceAuthorization
) {
  const configured = definition.capabilities ?? {};
  const hasCreate = Boolean(
    definition.forms?.create && definition.mutations?.create
  );
  const hasUpdate = Boolean(
    definition.forms?.update && definition.mutations?.update
  );
  const hasDelete = Boolean(definition.mutations?.delete);
  const hasImport = Boolean(definition.import && definition.mutations?.import);
  const selectionDisabled =
    definition.dataView.checkbox === false ||
    definition.dataView.selection?.enabled === false;
  const hasBulk = Boolean(
    definition.mutations?.deleteMany ||
    (definition.bulkDelete?.strategy === "individual" && hasDelete) ||
    definition.dataView.bulkActions?.length ||
    definition.bulkActions?.actions?.length
  );
  const authorized = (
    operation: "create" | "update" | "delete" | "import" | "export"
  ) =>
    authorizationAllows(definition.authorization?.[operation], authorization);
  const bulkPermissions = definition.authorization?.bulkActions
    ? Array.isArray(definition.authorization.bulkActions)
      ? definition.authorization.bulkActions
      : [definition.authorization.bulkActions]
    : [];
  return {
    create: (configured.create ?? true) && hasCreate && authorized("create"),
    update: (configured.update ?? true) && hasUpdate && authorized("update"),
    delete: (configured.delete ?? true) && hasDelete && authorized("delete"),
    import: (configured.import ?? false) && hasImport && authorized("import"),
    export:
      (configured.export ?? true) &&
      authorized("export") &&
      Boolean(definition.export ?? definition.dataView.exportConfig),
    selection: (configured.selection ?? true) && !selectionDisabled,
    bulkActions:
      (configured.bulkActions ?? true) &&
      !selectionDisabled &&
      (configured.selection ?? true) &&
      hasBulk &&
      bulkPermissions.every((permission) =>
        authorizationAllows(permission, authorization)
      ),
  };
}

function assertSelectionRows<TData>(
  rows: readonly TData[],
  rowSelection: Record<string, boolean>,
  getRowId: (row: TData) => string
) {
  return rows.filter((row) => Boolean(rowSelection[getRowId(row)]));
}

function mutationContext(
  mutationKey: readonly unknown[],
  storeId?: string
): ResourceMutationExecutionContext {
  return {
    client: new QueryClient(),
    mutationKey,
    meta: undefined,
    ...(storeId ? { execution: { storeId } } : {}),
  };
}

export function defineResourceContractSuite<
  TData,
  TCreateInput = unknown,
  TUpdateInput = unknown,
  TQueryRaw = ResourceListResult<TData>,
  TValue = unknown,
  TImport = Record<string, string>,
  TDeleteInput = string,
>({
  definition,
  name = definition.metadata.name,
  fixtures,
  sections,
}: ResourceContractSuiteOptions<
  TData,
  TCreateInput,
  TUpdateInput,
  TQueryRaw,
  TValue,
  TImport,
  TDeleteInput
>): ResourceContractSuite<
  TData,
  TCreateInput,
  TUpdateInput,
  TQueryRaw,
  TValue,
  TImport,
  TDeleteInput
> {
  const state = resourceState(fixtures);
  const resourceScope = definition.scope ?? DEFAULT_RESOURCE_SCOPE;
  const storeA = fixtures?.storeA ?? "store_a";
  const storeB = fixtures?.storeB ?? "store_b";
  const mappedPermissions = authorizationPermissions(definition.authorization);
  const authorizationFor = (
    storeId?: string,
    permissions?: readonly string[]
  ) =>
    createResourceAuthorization({
      ...(storeId ? { storeId } : {}),
      ...(fixtures?.authorization?.status
        ? { status: fixtures.authorization.status }
        : {}),
      permissions:
        permissions ??
        (storeId === storeB
          ? fixtures?.authorization?.storeB
          : storeId === storeA
            ? fixtures?.authorization?.storeA
            : fixtures?.authorization?.allow) ??
        mappedPermissions,
    });
  let suite!: ResourceContractSuite<
    TData,
    TCreateInput,
    TUpdateInput,
    TQueryRaw,
    TValue,
    TImport,
    TDeleteInput
  >;
  suite = {
    definition,
    state,
    scope: {
      key: (storeId) =>
        scopeResourceKey(
          resourceScope,
          queryBaseKey(definition, state, storeId),
          storeId
        ),
      mutationKey: (operation, storeId) =>
        scopeResourceKey(
          resourceScope,
          definition.mutations?.[
            operation as keyof NonNullable<typeof definition.mutations>
          ]?.mutationKey ?? ["resource", definition.metadata.name, operation],
          storeId
        ),
      invalidationKey: (queryKey, storeId) =>
        scopeResourceKey(resourceScope, queryKey, storeId),
      assertIsolated: () => {
        if (resourceScope === "store") {
          expect(
            scopeResourceKey(
              resourceScope,
              queryBaseKey(definition, state, storeA),
              storeA
            )
          ).not.toEqual(
            scopeResourceKey(
              resourceScope,
              queryBaseKey(definition, state, storeB),
              storeB
            )
          );
          expect(
            scopeResourceKey(resourceScope, queryBaseKey(definition, state))
          ).toEqual([
            "resource",
            "store-context-required",
            ...queryBaseKey(definition, state),
          ]);
        } else {
          expect(
            scopeResourceKey(
              resourceScope,
              queryBaseKey(definition, state),
              storeA
            )
          ).toEqual(
            scopeResourceKey(
              resourceScope,
              queryBaseKey(definition, state),
              storeB
            )
          );
        }
        const mutationOperations = Object.keys(definition.mutations ?? {});
        if (mutationOperations.length > 0) {
          const operation = mutationOperations[0]!;
          const storeAKey = suite.scope.mutationKey(operation, storeA);
          const storeBKey = suite.scope.mutationKey(operation, storeB);
          if (resourceScope === "store")
            expect(storeAKey).not.toEqual(storeBKey);
          else expect(storeAKey).toEqual(storeBKey);
        }
      },
    },
    query: {
      context: (storeId) => ({
        state,
        view: (() => {
          const view = resolveResourceView(definition.views, state.activeView);
          return {
            id: view.id,
            type: view.type,
            config: view.config ?? {},
            state: state.viewState[view.id] ?? {},
          };
        })(),
        ...(storeId ? { execution: { storeId } } : {}),
      }),
      key: (storeId) =>
        scopeResourceKey(
          resourceScope,
          queryBaseKey(definition, state, storeId),
          storeId
        ),
      execute: async (storeId, signal) => {
        if (!definition.query)
          throw new Error(`${definition.metadata.name} has no query.`);
        if (fixtures?.query?.error !== undefined) {
          throw normalizeAppError(fixtures.query.error);
        }
        const raw = fixtures?.query?.execute
          ? await fixtures.query.execute({
              state,
              view: (() => {
                const view = resolveResourceView(definition.views, state.activeView);
                return {
                  id: view.id,
                  type: view.type,
                  config: view.config ?? {},
                  state: state.viewState[view.id] ?? {},
                };
              })(),
              ...(signal ? { signal } : {}),
              ...(storeId ? { execution: { storeId } } : {}),
            })
          : fixtures?.query?.response;
        if (raw === undefined)
          throw new Error(
            "A query fixture is required to execute this contract."
          );
        return definition.query.normalize(raw);
      },
    },
    capabilities: (authorization = authorizationFor(storeA)) =>
      resolveResourceCapabilities(definition, {}, authorization),
    authorization: { forStore: authorizationFor },
    cache: {
      tools: (storeId) => {
        const invalidationKey = Object.values(
          definition.mutations ?? {}
        ).flatMap((mutation) =>
          mutation && Array.isArray(mutation.invalidateQueries)
            ? mutation.invalidateQueries
            : []
        )[0];
        return createResourceCacheTools<TData>({
          client: new QueryClient({
            defaultOptions: {
              queries: { retry: false },
              mutations: { retry: false },
            },
          }),
          scope: resourceScope,
          ...(storeId ? { storeId } : {}),
          listQueryKey:
            invalidationKey ?? queryBaseKey(definition, state, storeId),
        });
      },
    },
    selection: {
      selectedCurrentPage: (rows, rowSelection) =>
        assertSelectionRows(rows, rowSelection, definition.dataView.getRowId),
      preservesAcrossPages:
        definition.dataView.selection?.preserveAcrossPages === true,
      unloadedRowsSupported:
        definition.dataView.selection?.preserveAcrossPages === true &&
        Boolean(definition.mutations?.deleteMany?.getInputFromIds),
      explicit: (rowSelection) => createResourceSelection(rowSelection),
    },
    errors: {
      resolve: (error, context, options) =>
        resolveResourceError(error, context, {
          resourceLabel:
            definition.metadata.pluralLabel ?? definition.metadata.label,
          singularLabel: definition.metadata.singularLabel,
          ...options,
        }),
      query: (error, hasData = false) =>
        resolveResourceError(error, hasData ? "partial" : "query", {
          resourceLabel:
            definition.metadata.pluralLabel ?? definition.metadata.label,
          singularLabel: definition.metadata.singularLabel,
        }),
      mutation: (error, context = "update") =>
        resolveResourceError(error, context, {
          resourceLabel:
            definition.metadata.pluralLabel ?? definition.metadata.label,
          singularLabel: definition.metadata.singularLabel,
        }),
      partial: (succeededIds, failedIds) =>
        resolveResourceError(
          {
            type: "unknown",
            message: "Some selected items could not be processed.",
            details: { succeededIds, failedIds },
          },
          "partial",
          {
            resourceLabel:
              definition.metadata.pluralLabel ?? definition.metadata.label,
            singularLabel: definition.metadata.singularLabel,
            partial: { succeededIds, failedIds },
          }
        ),
    },
  };

  describe(`${name} Resource contract`, () => {
    if (sections?.scope !== false) {
      it("isolates Store keys and fails closed without Store context", () =>
        suite.scope.assertIsolated());
    }

    if (sections?.cache !== false) {
      it("exposes cache tools that remain bound to one Resource scope", async () => {
        const queryClient = new QueryClient({
          defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
          },
        });
        const listKey =
          Object.values(definition.mutations ?? {}).flatMap((mutation) =>
            mutation && Array.isArray(mutation.invalidateQueries)
              ? mutation.invalidateQueries
              : []
          )[0] ?? queryBaseKey(definition, state, storeA);
        const storeATools = createResourceCacheTools<TData>({
          client: queryClient,
          scope: resourceScope,
          ...(resourceScope === "store" ? { storeId: storeA } : {}),
          listQueryKey: listKey,
        });
        const storeBTools = createResourceCacheTools<TData>({
          client: queryClient,
          scope: resourceScope,
          ...(resourceScope === "store" ? { storeId: storeB } : {}),
          listQueryKey: listKey,
        });

        storeATools.setListData({ rows: [], count: 0 });
        storeBTools.setListData({ rows: [], count: 0 });
        expect(storeATools.available).toBe(true);
        expect(storeATools.getListData()).toEqual({ rows: [], count: 0 });
        expect(storeBTools.getListData()).toEqual({ rows: [], count: 0 });
        if (resourceScope === "store") {
          expect(queryClient.getQueryData(listKey)).toBeUndefined();
        }

        const storeAKey = scopeResourceKey(
          resourceScope,
          listKey,
          resourceScope === "store" ? storeA : undefined
        );
        const storeBKey = scopeResourceKey(
          resourceScope,
          listKey,
          resourceScope === "store" ? storeB : undefined
        );
        if (resourceScope === "store") {
          expect(storeAKey).not.toEqual(storeBKey);
          storeATools.removeList();
          expect(queryClient.getQueryData(storeAKey)).toBeUndefined();
          expect(queryClient.getQueryData(storeBKey)).toEqual({
            rows: [],
            count: 0,
          });
          storeATools.setListData({ rows: [], count: 0 });
          await queryClient.invalidateQueries({ queryKey: storeAKey });
          expect(queryClient.getQueryState(storeAKey)?.isInvalidated).toBe(
            true
          );
          expect(queryClient.getQueryState(storeBKey)?.isInvalidated).toBe(
            false
          );
        } else {
          expect(storeAKey).toEqual(storeBKey);
        }

        const missing = createResourceCacheTools<TData>({
          client: queryClient,
          scope: "store",
          listQueryKey: listKey,
        });
        expect(missing.available).toBe(false);
        missing.setListData({ rows: [], count: 0 });
        expect(
          queryClient.getQueryData([
            "resource",
            "store-context-required",
            ...listKey,
          ])
        ).toBeUndefined();

        const authorizationA = authorizationFor(storeA, []);
        const authorizationB = authorizationFor(storeA, mappedPermissions);
        expect(
          scopeResourceKey(resourceScope, listKey, authorizationA.storeId)
        ).toEqual(
          scopeResourceKey(resourceScope, listKey, authorizationB.storeId)
        );
      });
    }

    if (sections?.query !== false && definition.query) {
      it("provides a stable scoped query key and normalizer", async () => {
        expect(suite.query.key(storeA)).toEqual(suite.query.key(storeA));
        if (resourceScope === "store") {
          expect(suite.query.key(storeA)).not.toEqual(suite.query.key(storeB));
        } else {
          expect(suite.query.key(storeA)).toEqual(suite.query.key(storeB));
        }
        if (
          fixtures?.query?.response !== undefined ||
          fixtures?.query?.execute
        ) {
          const normalized = await suite.query.execute(storeA);
          expect(Array.isArray(normalized.rows)).toBe(true);
          expect(typeof normalized.count).toBe("number");
        }
      });
      const queryError = fixtures?.query?.error;
      if (queryError !== undefined) {
        it("surfaces query failures through the fixture boundary", async () => {
          const expected = normalizeAppError(queryError);
          await expect(suite.query.execute(storeA)).rejects.toMatchObject({
            name: "AppError",
            type: expected.type,
            ...(expected.code ? { code: expected.code } : {}),
          });
        });
      }
    }

    if (sections?.errors !== false) {
      it("normalizes Resource error semantics without message parsing", () => {
        expect(suite.errors.query({ status: 500 })).toMatchObject({
          context: "query",
          blocking: true,
          retryable: true,
          error: { type: "server" },
        });
        expect(suite.errors.query({ status: 500 }, true)).toMatchObject({
          context: "partial",
          blocking: false,
          retryable: true,
        });
        expect(suite.errors.query({ status: 403 })).toMatchObject({
          error: { type: "authorization" },
          retryable: false,
        });
        expect(suite.errors.query({ name: "AbortError" })).toBeNull();
        expect(
          suite.errors.mutation({
            status: 422,
            fieldErrors: { handle: ["Already exists."] },
          })
        ).toMatchObject({
          context: "update",
          fieldErrors: { handle: ["Already exists."] },
        });
        expect(suite.errors.mutation({ status: 409 }, "create")).toMatchObject({
          error: { type: "conflict" },
          retryable: false,
        });
        expect(suite.errors.partial(["a", "b"], ["c"])).toMatchObject({
          context: "partial",
          severity: "warning",
          blocking: false,
          partial: { succeededIds: ["a", "b"], failedIds: ["c"] },
        });
      });
    }

    if (sections?.capabilities !== false) {
      it("keeps capabilities at configured intersect implemented", () => {
        if (mappedPermissions.length === 0) {
          expect(resolveResourceCapabilities(definition)).toEqual(
            expectedCapabilities(definition)
          );
          return;
        }

        const allowed = authorizationFor(storeA, mappedPermissions);
        expect(resolveResourceCapabilities(definition, {}, allowed)).toEqual(
          expectedCapabilities(definition, allowed)
        );

        const denied = authorizationFor(storeA, []);
        const unavailable = createResourceAuthorization({
          storeId: storeA,
          status: "loading",
          permissions: mappedPermissions,
        });
        const deniedCapabilities = resolveResourceCapabilities(
          definition,
          {},
          denied
        );
        const unavailableCapabilities = resolveResourceCapabilities(
          definition,
          {},
          unavailable
        );
        expect(deniedCapabilities).toEqual(
          expectedCapabilities(definition, denied)
        );
        expect(unavailableCapabilities).toEqual(
          expectedCapabilities(definition, unavailable)
        );

        const access = resolveResourceAccess(definition, allowed);
        expect(access.read).toBe(
          authorizationAllows(definition.authorization?.read, allowed)
        );
        if (definition.authorization?.read) {
          expect(resolveResourceAccess(definition, denied).read).toBe(false);
          expect(resolveResourceAccess(definition, unavailable).read).toBe(
            false
          );
        }

        if (resourceScope === "store") {
          const storeBAuthorization = authorizationFor(storeB, []);
          if (definition.authorization?.read) {
            expect(allowed.can(definition.authorization.read)).not.toBe(
              storeBAuthorization.can(definition.authorization.read)
            );
          }
        }
      });
    }

    if (sections?.mutations !== false) {
      it("exposes only configured mutation contracts with scoped invalidations", () => {
        // Invalidation metadata is scoped by Resource Core. Cache callbacks
        // use the scoped facade exposed by the Resource mutation adapter.
        for (const [operation, mutation] of Object.entries(
          definition.mutations ?? {}
        )) {
          if (!mutation) continue;
          const key = scopeResourceKey(
            resourceScope,
            mutation.mutationKey ?? [
              "resource",
              definition.metadata.name,
              operation,
            ],
            storeA
          );
          expect(key.length).toBeGreaterThan(0);
          for (const queryKey of Array.isArray(mutation.invalidateQueries)
            ? mutation.invalidateQueries
            : []) {
            const storeAKey = scopeResourceKey(resourceScope, queryKey, storeA);
            const storeBKey = scopeResourceKey(resourceScope, queryKey, storeB);
            if (resourceScope === "store") {
              expect(storeAKey).not.toEqual(storeBKey);
            } else {
              expect(storeAKey).toEqual(storeBKey);
            }
          }
        }
      });
      const mutationFixtures = fixtures?.mutations;
      if (
        mutationFixtures?.createInput !== undefined &&
        definition.mutations?.create
      ) {
        it("executes the create mutation contract with trusted scope", async () => {
          await definition.mutations!.create!.mutationFn(
            mutationFixtures.createInput!,
            mutationContext(suite.scope.mutationKey("create", storeA), storeA)
          );
        });
      }
      if (mutationFixtures?.update && definition.mutations?.update) {
        it("executes the update mutation contract with record-derived input", async () => {
          const input = definition.mutations!.update!.getInput(
            mutationFixtures.update!
          );
          await definition.mutations!.update!.mutationFn(
            input,
            mutationContext(suite.scope.mutationKey("update", storeA), storeA)
          );
        });
      }
      if (
        mutationFixtures?.deleteInput !== undefined &&
        definition.mutations?.delete
      ) {
        it("executes the delete mutation contract with trusted scope", async () => {
          await definition.mutations!.delete!.mutationFn(
            mutationFixtures.deleteInput!,
            mutationContext(suite.scope.mutationKey("delete", storeA), storeA)
          );
        });
      }
      if (
        mutationFixtures?.deleteManyInput !== undefined &&
        definition.mutations?.deleteMany
      ) {
        it("executes the bulk mutation contract with trusted scope", async () => {
          await definition.mutations!.deleteMany!.mutationFn(
            mutationFixtures.deleteManyInput as never,
            mutationContext(
              suite.scope.mutationKey("deleteMany", storeA),
              storeA
            )
          );
        });
      }
      if (
        mutationFixtures?.reorderInput !== undefined &&
        definition.mutations?.reorder
      ) {
        it("executes the reorder mutation contract with trusted scope", async () => {
          await definition.mutations!.reorder!.mutationFn(
            mutationFixtures.reorderInput as never,
            mutationContext(suite.scope.mutationKey("reorder", storeA), storeA)
          );
        });
      }
      if (
        mutationFixtures?.importInput !== undefined &&
        definition.mutations?.import
      ) {
        it("executes the import mutation contract with trusted scope", async () => {
          await definition.mutations!.import!.mutationFn(
            mutationFixtures.importInput as never,
            mutationContext(suite.scope.mutationKey("import", storeA), storeA)
          );
        });
      }
    }

    if (sections?.forms !== false && definition.forms) {
      it("declares valid create/update form boundaries", () => {
        for (const mode of ["create", "update"] as const) {
          const form = definition.forms?.[mode];
          if (!form) continue;
          expect(form.mode ?? form.presentation ?? "dialog").toBeTruthy();
          if ("component" in form) {
            expect(form.component).toBeDefined();
          } else if ("fields" in form) {
            expect(form.schema).toBeDefined();
            expect(Array.isArray(form.fields)).toBe(true);
          } else if ("sections" in form) {
            expect(form.schema).toBeDefined();
            expect(Array.isArray(form.sections)).toBe(true);
          } else if ("steps" in form) {
            expect(form.schema).toBeDefined();
            expect(Array.isArray(form.steps)).toBe(true);
          } else {
            expect(form.mode).toBe("page");
            expect(form.href).toBeDefined();
          }
          if (form.defaultValues !== undefined)
            expect(form.defaultValues).toBeDefined();
        }
      });
    }

    if (sections?.dataView !== false) {
      it("declares the Resource ↔ DataView identity and state boundary", () => {
        expect(Array.isArray(definition.dataView.columns)).toBe(true);
        expect(typeof definition.dataView.getRowId).toBe("function");
        expect(state.search).toBe(state.search.trim());
        const tableState = getDataViewTableState(state);
        expect(tableState.pagination.pageIndex).toBeGreaterThanOrEqual(0);
        expect(tableState.pagination.pageSize).toBeGreaterThan(0);
        expect(state.sorting.length).toBeLessThanOrEqual(1);
        expect(Object.keys(state.filters)).toEqual(
          [...Object.keys(state.filters)].sort((left, right) =>
            left.localeCompare(right)
          )
        );
        if (definition.dataView.urlState?.allowedSortIds) {
          expect(
            new Set(definition.dataView.urlState.allowedSortIds).size
          ).toBe(definition.dataView.urlState.allowedSortIds.length);
        }
        if (fixtures?.rows) {
          const ids = fixtures.rows.map(definition.dataView.getRowId);
          expect(new Set(ids).size).toBe(ids.length);
        }
      });
    }

    if (sections?.selection !== false) {
      it("documents current-page selection semantics", () => {
        if (
          definition.dataView.selection?.enabled === false ||
          definition.dataView.checkbox === false
        ) {
          expect(suite.capabilities().selection).toBe(false);
          return;
        }
        expect(definition.dataView.selection?.mode ?? "multiple").toMatch(
          /single|multiple/
        );
        const selection = suite.selection.explicit({ selected: true });
        expect(selection.mode).toBe("explicit");
        expect(selection.selectedIds).toEqual(selection.executeIds);
        expect(suite.selection.unloadedRowsSupported).toBe(
          suite.selection.preservesAcrossPages &&
            Boolean(definition.mutations?.deleteMany?.getInputFromIds)
        );
        if (suite.selection.preservesAcrossPages) {
          expect(
            suite.selection.selectedCurrentPage([], { unloaded_row: true })
          ).toEqual([]);
        }
      });
    }

    if (sections?.importExport !== false) {
      it("does not advertise import/export without executable configuration", () => {
        if (definition.import) {
          expect(definition.import.config).toBeDefined();
          expect(suite.capabilities().import).toBe(
            Boolean(definition.capabilities?.import) &&
              Boolean(definition.mutations?.import)
          );
        } else expect(suite.capabilities().import).toBe(false);
        if (definition.export ?? definition.dataView.exportConfig) {
          expect(suite.capabilities().export).toBe(true);
        } else expect(suite.capabilities().export).toBe(false);
        for (const mode of definition.export?.modes ??
          definition.dataView.exportConfig?.modes ??
          []) {
          expect(["current-page", "selected", "filtered", "all"]).toContain(
            mode
          );
        }
      });
    }

    if (
      sections?.hierarchy !== false &&
      (definition.dataView.hierarchy || definition.dataView.reorder)
    ) {
      it("declares stable hierarchy/reorder hooks when enabled", () => {
        if (definition.dataView.hierarchy) {
          expect(definition.dataView.hierarchy.enabled).toBe(true);
          expect(typeof definition.dataView.hierarchy.getRowId).toBe(
            "function"
          );
          expect(typeof definition.dataView.hierarchy.getParentId).toBe(
            "function"
          );
          expect(typeof definition.dataView.hierarchy.getOrder).toBe(
            "function"
          );
        }
        if (definition.dataView.reorder)
          expect(typeof definition.dataView.reorder.getPayload).toBe(
            "function"
          );
      });
    }
  });

  return suite;
}
