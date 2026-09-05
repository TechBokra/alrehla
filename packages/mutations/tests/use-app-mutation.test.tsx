import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import {
  useAppMutation,
  useCreateMutation,
  type ActionResult,
  type MutationError,
} from "../src";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("useAppMutation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("unwraps successful ActionResults, toasts, invalidates, and calls callbacks", async () => {
    const queryClient = new QueryClient();
    const invalidateQueries = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue();
    const onSuccess = vi.fn().mockResolvedValue(undefined);
    const mutationFn = vi.fn(
      async (id: string) =>
        ({
          success: true,
          data: { id, title: "New product" },
        }) satisfies ActionResult<{
          id: string;
          title: string;
        }>
    );

    const { result } = renderHook(
      () =>
        useAppMutation({
          mutationFn,
          successMessage: (product) => `${product.title} created`,
          invalidateQueries: [["products", "list"]],
          onSuccess,
        }),
      { wrapper: createWrapper(queryClient) }
    );

    let data: { id: string; title: string } | undefined;
    await act(async () => {
      data = await result.current.mutateAsync("product-1");
    });

    expect(data).toEqual({ id: "product-1", title: "New product" });
    expect(mutationFn).toHaveBeenCalledWith("product-1", expect.anything());
    expect(toast.success).toHaveBeenCalledWith("New product created");
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["products", "list"],
    });
    expect(onSuccess).toHaveBeenCalledWith(
      data,
      "product-1",
      undefined,
      expect.anything()
    );
  });

  it("normalizes ActionResult failures and displays field-aware errors", async () => {
    const queryClient = new QueryClient();
    const onError = vi.fn();
    const mutationFn = vi.fn(
      async () =>
        ({
          success: false,
          error: {
            code: "HANDLE_EXISTS",
            message: "A product with this handle already exists.",
            fieldErrors: { handle: ["Handle already exists."] },
          },
        }) satisfies ActionResult<never>
    );

    const { result } = renderHook(
      () =>
        useCreateMutation({
          mutationFn,
          errorMessage: (error) => `Could not save: ${error.message}`,
          onError,
        }),
      { wrapper: createWrapper(queryClient) }
    );

    await expect(
      act(async () => result.current.mutateAsync({ handle: "existing" }))
    ).rejects.toMatchObject({
      name: "MutationError",
      code: "HANDLE_EXISTS",
      fieldErrors: { handle: ["Handle already exists."] },
    } satisfies Partial<MutationError>);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Could not save: A product with this handle already exists."
      );
    });
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ code: "HANDLE_EXISTS" }),
      { handle: "existing" },
      undefined,
      expect.anything()
    );
  });

  it("supports optional cache updates before invalidation", async () => {
    const queryClient = new QueryClient();
    const setQueryData = vi.spyOn(queryClient, "setQueryData");
    const mutationFn = vi.fn(async () => ({
      success: true,
      data: { id: "p1" },
    }));

    const { result } = renderHook(
      () =>
        useAppMutation({
          mutationFn,
          updateCache: (product, _variables, client) => {
            client.setQueryData(["products", product.id], product);
          },
        }),
      { wrapper: createWrapper(queryClient) }
    );

    await act(async () => {
      await result.current.mutateAsync(undefined);
    });

    expect(setQueryData).toHaveBeenCalledWith(["products", "p1"], {
      id: "p1",
    });
  });

  it("does not report success for a conflict and preserves recovery metadata", async () => {
    const queryClient = new QueryClient();
    const onSuccess = vi.fn();
    const onError = vi.fn();
    const mutationFn = vi.fn(async () => ({
      success: false as const,
      error: {
        kind: "conflict" as const,
        message: "This category changed. Reload and retry.",
      },
    }));

    const { result } = renderHook(
      () =>
        useAppMutation({
          mutationFn,
          successMessage: "Category saved",
          onSuccess,
          onError,
        }),
      { wrapper: createWrapper(queryClient) }
    );

    await expect(
      act(async () => result.current.mutateAsync(undefined))
    ).rejects.toMatchObject({
      kind: "conflict",
      message: "This category changed. Reload and retry.",
    });
    expect(onSuccess).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({ kind: "conflict" }),
        undefined,
        undefined,
        expect.anything()
      );
      expect(toast.error).toHaveBeenCalledWith(
        "This category changed. Reload and retry."
      );
    });
    expect(toast.success).not.toHaveBeenCalled();
  });
});
