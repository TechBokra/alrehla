import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useUpdateProductVariantMutation, type ActionResult } from "../src";

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("generated Admin mutation hooks", () => {
  it("uses the shared lifecycle and Dashboard-derived cross-resource invalidations", async () => {
    const queryClient = new QueryClient();
    const invalidateQueries = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue();
    const executor = vi.fn(
      async (input: { id: string }) =>
        ({ success: true, data: input }) satisfies ActionResult<{ id: string }>
    );

    const { result } = renderHook(
      () => useUpdateProductVariantMutation(executor),
      { wrapper: createWrapper(queryClient) }
    );

    await act(async () => {
      await result.current.mutateAsync({ id: "variant_1" });
    });

    expect(executor).toHaveBeenCalledWith(
      { id: "variant_1" },
      expect.anything()
    );
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["product-variants", "list"],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["product-variants", "detail"],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["products", "detail"],
    });
  });
});
