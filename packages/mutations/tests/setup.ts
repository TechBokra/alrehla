import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

export const actionFailureFixture = Object.freeze({
  success: false as const,
  error: {
    code: "TEST_FAILURE",
    kind: "server" as const,
    message: "The request could not be completed.",
    fieldErrors: { name: ["Use a different name."] },
  },
});

export const conflictActionFailureFixture = Object.freeze({
  success: false as const,
  error: {
    code: "STALE_WRITE",
    kind: "conflict" as const,
    message: "The record changed before it could be saved.",
    fieldErrors: { name: ["Reload the record and try again."] },
  },
});

export const unauthorizedActionFailureFixture = Object.freeze({
  success: false as const,
  error: {
    code: "SESSION_EXPIRED",
    kind: "unauthorized" as const,
    message: "Your session has expired. Sign in again.",
  },
});

afterEach(() => cleanup());

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;
