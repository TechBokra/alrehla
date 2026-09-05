import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AppError } from "@eng-mohamedelsayed/mutations/types";
import {
  EmptyState,
  SearchEmptyState,
} from "../src/components/feedback/empty-state";
import { ErrorState } from "../src/components/feedback/error-state";
import { LoadingState } from "../src/components/feedback/loading-state";
import { UnauthorizedState } from "../src/components/feedback/unauthorized-state";
import {
  ResourceErrorBanner,
  ResourceErrorState,
} from "../src/components/feedback/resource-error-state";

describe("shared feedback states", () => {
  it("renders the required state variants with recoverable actions", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const onSignIn = vi.fn();

    render(
      <>
        <LoadingState label="Loading categories..." />
        <EmptyState
          title="No categories yet"
          action={<button>Create category</button>}
        />
        <SearchEmptyState title="No matching categories" />
        <ErrorState
          title="Categories unavailable"
          description="Try again when the backend is available."
          error={new Error("internal backend detail")}
          onRetry={onRetry}
        />
        <UnauthorizedState onSignIn={onSignIn} />
      </>
    );

    expect(screen.getByText("Loading categories...")).toBeTruthy();
    expect(screen.getByText("No categories yet")).toBeTruthy();
    expect(screen.getByText("No matching categories")).toBeTruthy();
    expect(
      screen.getByText("Try again when the backend is available.")
    ).toBeTruthy();
    expect(screen.queryByText("internal backend detail")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Try again" }));
    await user.click(screen.getByRole("button", { name: "Sign in again" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onSignIn).toHaveBeenCalledTimes(1);
  });

  it("allows an explicit safe error message when a caller opts in", () => {
    render(
      <ErrorState
        description="Safe description"
        error={new Error("safe normalized message")}
        showErrorMessage
      />
    );

    expect(screen.getByText("safe normalized message")).toBeTruthy();
  });

  it("keeps the unauthorized recovery action keyboard accessible", async () => {
    const user = userEvent.setup();
    const onSignIn = vi.fn();

    render(<UnauthorizedState onSignIn={onSignIn} />);

    const signIn = screen.getByRole("button", { name: "Sign in again" });
    await user.tab();
    expect(document.activeElement).toBe(signIn);

    await user.keyboard("{Enter}");
    expect(onSignIn).toHaveBeenCalledTimes(1);
  });

  it("uses Resource semantics for blocking and partial feedback", () => {
    const onRetry = vi.fn();
    render(
      <>
        <ResourceErrorState
          state={{
            context: "query",
            error: new AppError("not shown"),
            severity: "error",
            blocking: true,
            retryable: true,
            title: "Could not load Products.",
            description: "Try again.",
          }}
          onRetry={onRetry}
        />
        <ResourceErrorBanner
          state={{
            context: "partial",
            error: new AppError("not shown"),
            severity: "warning",
            blocking: false,
            retryable: false,
            title: "Products loaded with warnings.",
            description: "Some rows may be stale.",
            partial: { succeededIds: ["p1", "p2"], failedIds: ["p3"] },
          }}
        />
      </>
    );

    expect(screen.getByText("Could not load Products.")).toBeTruthy();
    expect(screen.getByText(/2 succeeded, 1 failed\./)).toBeTruthy();
    expect(screen.queryByText("not shown")).toBeNull();
  });
});
