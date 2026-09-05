import { describe, expect, it } from "vitest";
import {
  applyServerFieldErrors,
  normalizeActionResult,
  normalizeMutationError,
} from "../src";

describe("mutation utilities", () => {
  it("normalizes unknown, validation, and network errors safely", () => {
    expect(
      normalizeMutationError({
        status: 422,
        errors: [{ path: "title", message: "Required" }],
      })
    ).toMatchObject({
      kind: "validation",
      fieldErrors: { title: ["Required"] },
    });
    expect(normalizeMutationError(new TypeError("fetch failed")).kind).toBe(
      "network"
    );
    expect(
      normalizeMutationError({ name: "AbortError", message: "aborted" }).kind
    ).toBe("cancelled");
    expect(
      normalizeMutationError({ code: "ETIMEDOUT", message: "request timeout" })
    ).toMatchObject({ kind: "timeout", code: "TIMEOUT" });
    expect(normalizeMutationError("unknown value").message).toBe(
      "Something went wrong. Please try again."
    );
    expect(
      normalizeMutationError({
        kind: "conflict",
        code: "STALE_CATEGORY",
        message: "The category changed before it could be saved.",
        fieldErrors: { name: ["Reload the category and try again."] },
      })
    ).toMatchObject({
      kind: "conflict",
      code: "STALE_CATEGORY",
      fieldErrors: { name: ["Reload the category and try again."] },
    });

    expect(
      [401, 403, 404, 409, 422, 429, 500].map(
        (status) => normalizeMutationError({ status }).kind
      )
    ).toEqual([
      "unauthorized",
      "forbidden",
      "not_found",
      "conflict",
      "validation",
      "rate_limited",
      "server",
    ]);
  });

  it("maps server errors to TanStack Form's onServer channel", () => {
    let captured: unknown;
    const form = {
      setErrorMap: (errorMap: never) => {
        captured = errorMap;
      },
    };

    applyServerFieldErrors(
      form,
      normalizeMutationError({
        message: "Please correct the form.",
        fieldErrors: { handle: ["Already exists.", "Use another handle."] },
      })
    );

    expect(captured).toEqual({
      onServer: {
        form: "Please correct the form.",
        fields: { handle: "Already exists., Use another handle." },
      },
    });
  });

  it("leaves direct data untouched and unwraps successful actions", () => {
    expect(normalizeActionResult({ id: "direct" })).toEqual({ id: "direct" });
    expect(
      normalizeActionResult({ success: true, data: { id: "action" } })
    ).toEqual({ id: "action" });
  });

  it("preserves normalized action failure metadata", () => {
    expect(() =>
      normalizeActionResult({
        success: false,
        error: {
          kind: "conflict",
          code: "STALE_WRITE",
          message: "The record changed. Reload and try again.",
          fieldErrors: { name: ["The current name is no longer available."] },
        },
      })
    ).toThrowError(
      expect.objectContaining({
        kind: "conflict",
        code: "STALE_WRITE",
        fieldErrors: { name: ["The current name is no longer available."] },
      })
    );
  });
});
