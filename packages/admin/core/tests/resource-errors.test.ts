import { describe, expect, it } from "vitest";
import {
  extractResourcePartialOutcome,
  resolveResourceError,
} from "../src/resource/errors";

describe("Resource error semantics", () => {
  it("distinguishes blocking initial failures from non-blocking refetches", () => {
    const initial = resolveResourceError(
      { status: 500, message: "internal database details" },
      "query",
      { resourceLabel: "Products", singularLabel: "Product" }
    );
    const partial = resolveResourceError(
      { status: 500, message: "internal database details" },
      "partial",
      { resourceLabel: "Products", singularLabel: "Product" }
    );

    expect(initial).toMatchObject({
      blocking: true,
      retryable: true,
      title: "Could not load Products.",
    });
    expect(initial?.description).not.toContain("internal database details");
    expect(partial).toMatchObject({ blocking: false, severity: "warning" });
  });

  it("keeps authorization, validation, conflict, and cancellation distinct", () => {
    expect(resolveResourceError({ status: 403 }, "query")).toMatchObject({
      error: { type: "authorization" },
      retryable: false,
    });
    expect(
      resolveResourceError(
        { status: 422, fieldErrors: { handle: ["Already used"] } },
        "form"
      )
    ).toMatchObject({
      error: { type: "validation" },
      fieldErrors: { handle: ["Already used"] },
    });
    expect(resolveResourceError({ status: 409 }, "update")).toMatchObject({
      error: { type: "conflict" },
      retryable: false,
    });
    expect(resolveResourceError({ name: "AbortError" }, "query")).toBeNull();
  });

  it("extracts structured partial IDs without message parsing", () => {
    expect(
      extractResourcePartialOutcome({
        details: { succeededIds: ["a", "b"], failedIds: ["c"] },
      })
    ).toEqual({ succeededIds: ["a", "b"], failedIds: ["c"] });
  });
});
