import * as React from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  createResourceAuthorization,
  defineResource,
  ResourceAuthorizationProvider,
  ResourceProvider,
  useResource,
  useResourceQuery,
  createDataViewState,
  type ResourceAuthorizationStatus,
  type ResourceQueryContext,
} from "../src";
import { createResourceTestEnvironment } from "../src/testing";

function fixture(protectedResource = false) {
  const queryKey = vi.fn(({ view }: ResourceQueryContext) => [
    "views",
    view?.id,
  ]);
  const queryFn = vi.fn(async ({ view }: ResourceQueryContext) => ({
    rows: [{ id: view!.id }],
    count: 1,
  }));
  const resource = defineResource<{ id: string }>({
    metadata: { name: "views", label: "Views", singularLabel: "View" },
    ...(protectedResource ? { authorization: { read: "resource.read" } } : {}),
    views: [
      { id: "table", type: "table", default: true },
      { id: "grid", type: "grid", permission: "grid.read" },
    ],
    query: { queryKey, queryFn, normalize: (raw) => raw },
    dataView: { columns: [], getRowId: (row) => row.id },
  });
  return { resource, queryKey, queryFn };
}

describe("Resource effective view authorization", () => {
  it("blocks query callbacks and manual refetch when read is allowed but every view is denied", async () => {
    const { resource, queryKey, queryFn } = fixture(true);
    const permissionedOnly = defineResource({
      ...resource,
      views: [
        { id: "grid", type: "grid", default: true, permission: "grid.read" },
      ],
    });
    const environment = createResourceTestEnvironment({
      storeId: "a",
      authorization: { permissions: ["resource.read"] },
    });
    const hook = renderHook(
      () =>
        useResourceQuery(
          permissionedOnly,
          undefined,
          createDataViewState({ activeView: "grid" })
        ),
      { wrapper: environment.wrapper }
    );
    expect(hook.result.current.fetchStatus).toBe("idle");
    expect(hook.result.current.data).toBeUndefined();
    expect(
      environment.queryClient.getQueryCache().getAll()[0]?.queryKey
    ).toEqual(["store", "a", "resource", "views", "disabled"]);
    const result = await hook.result.current.refetch();
    expect(result.error?.message).toContain("no authorized active view");
    expect(queryKey).not.toHaveBeenCalled();
    expect(queryFn).not.toHaveBeenCalled();
  });

  it.each([true, false])(
    "keeps the pending request then resolves permissions (granted=%s)",
    async (granted) => {
      const { resource, queryFn } = fixture();
      const environment = createResourceTestEnvironment({
        storeId: "a",
        searchParams: new URLSearchParams("view=grid&unknown=kept"),
      });
      let finish: (() => void) | undefined;
      function Wrapper({ children }: { children: React.ReactNode }) {
        const [status, setStatus] =
          React.useState<ResourceAuthorizationStatus>("loading");
        finish = () => setStatus("ready");
        return (
          <environment.wrapper>
            <ResourceAuthorizationProvider
              value={createResourceAuthorization({
                status,
                permissions: granted ? ["grid.read"] : [],
              })}
            >
              <ResourceProvider definition={resource}>
                {children}
              </ResourceProvider>
            </ResourceAuthorizationProvider>
          </environment.wrapper>
        );
      }
      const hook = renderHook(() => useResource(), { wrapper: Wrapper });
      expect(hook.result.current.dataView.state.activeView).toBe("grid");
      expect(hook.result.current.dataView.view?.id).toBe("table");
      await waitFor(() => expect(queryFn).toHaveBeenCalled());
      expect(
        queryFn.mock.calls.every(([context]) => context.view?.id === "table")
      ).toBe(true);
      expect(environment.navigation.replaces).toEqual([]);
      act(() => finish?.());
      await waitFor(() =>
        expect(hook.result.current.dataView.view?.id).toBe(
          granted ? "grid" : "table"
        )
      );
      if (granted) {
        await waitFor(() =>
          expect(
            queryFn.mock.calls.some(([context]) => context.view?.id === "grid")
          ).toBe(true)
        );
        expect(environment.navigation.replaces).toEqual([]);
      } else {
        await waitFor(() =>
          expect(environment.navigation.replaces).toEqual([
            "/resource?view=table&unknown=kept",
          ])
        );
      }
    }
  );

  it("allows a manual public choice while permissioned alternatives are pending", () => {
    const { resource } = fixture();
    const environment = createResourceTestEnvironment({
      storeId: "a",
      authorization: { status: "loading" },
      searchParams: new URLSearchParams("view=grid&unknown=kept"),
    });
    const hook = renderHook(() => useResource(), {
      wrapper: ({ children }) => (
        <environment.Resource definition={resource}>
          {children}
        </environment.Resource>
      ),
    });
    act(() => hook.result.current.dataView.setActiveView("grid"));
    expect(environment.navigation.pushes).toEqual([]);
    act(() => hook.result.current.dataView.setActiveView("table"));
    expect(environment.navigation.pushes).toEqual(["/resource?unknown=kept"]);
    expect(hook.result.current.dataView.view?.id).toBe("table");
  });

  it.each(["loading", "ready"] as const)(
    "withholds execution and rows for protected access (%s)",
    (status) => {
      const { resource, queryKey, queryFn } = fixture(true);
      const environment = createResourceTestEnvironment({
        storeId: "a",
        authorization: { status, permissions: [] },
        searchParams: new URLSearchParams("view=grid&unknown=kept"),
      });
      const hook = renderHook(() => useResource(), {
        wrapper: ({ children }) => (
          <environment.Resource
            definition={resource}
            initialData={{ rows: [{ id: "stale" }], count: 1 }}
          >
            {children}
          </environment.Resource>
        ),
      });
      expect(typeof hook.result.current.dataView.state.activeView).toBe(
        "string"
      );
      expect(hook.result.current.dataView.view).toBeNull();
      expect(hook.result.current.dataView.data).toEqual([]);
      expect(queryKey).not.toHaveBeenCalled();
      expect(queryFn).not.toHaveBeenCalled();
      if (status === "loading")
        expect(environment.navigation.replaces).toEqual([]);
    }
  );
});
