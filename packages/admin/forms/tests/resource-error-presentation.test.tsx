import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AppError } from "@eng-mohamedelsayed/mutations/types";
import {
  ResourceAccessDeniedState,
  ResourceErrorBanner,
  ResourceErrorState,
  ResourceOperationFeedback,
} from "@eng-mohamedelsayed/admin-ui/components/feedback/resource-error-state";
import { DataTable } from "@eng-mohamedelsayed/admin-ui/components/data-table/core/data-table";
import { DeleteConfirmationDialog } from "@eng-mohamedelsayed/admin-ui/components/feedback/delete-confirmation-dialog";
import { useCoreForm, CoreForm } from "../src/components/forms/core/core-form";
import { applyServerFieldErrors } from "@eng-mohamedelsayed/mutations/utils";
import { z } from "zod";

describe("Phase 2A UI — Resource Error Presentation", () => {
  describe("1. Initial Resource load error", () => {
    it("renders reusable resource-level error state with clear title, description, and accessible retry", async () => {
      const user = userEvent.setup();
      const onRetry = vi.fn();

      render(
        <ResourceErrorState
          state={{
            context: "query",
            error: new AppError("Internal network failure", {
              type: "network",
            }),
            severity: "error",
            blocking: true,
            retryable: true,
            title: "Could not load Products",
            description: "Something went wrong while loading your products.",
          }}
          onRetry={onRetry}
        />
      );

      const alert = screen.getByRole("alert");
      expect(alert).toBeTruthy();
      expect(screen.getByText("Could not load Products")).toBeTruthy();
      expect(
        screen.getByText("Something went wrong while loading your products.")
      ).toBeTruthy();

      const retryBtn = screen.getByRole("button", { name: /try again/i });
      expect(retryBtn).toBeTruthy();

      // Keyboard accessible retry
      await user.click(retryBtn);
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it("omits retry button when the error is non-retryable", () => {
      render(
        <ResourceErrorState
          state={{
            context: "query",
            error: new AppError("Resource not found", { type: "not_found" }),
            severity: "error",
            blocking: true,
            retryable: false,
            title: "Could not load Products",
            description: "Products could not be found.",
          }}
          onRetry={vi.fn()}
        />
      );

      expect(screen.getByText("Could not load Products")).toBeTruthy();
      expect(screen.queryByRole("button", { name: /try again/i })).toBeNull();
    });
  });

  describe("2. Background / refetch error", () => {
    it("renders a subtle non-blocking banner without replacing existing table data", async () => {
      const user = userEvent.setup();
      const onRetry = vi.fn();

      const columns = [
        { accessorKey: "id", header: "ID" },
        { accessorKey: "title", header: "Title" },
      ];
      const data = [
        { id: "prod_1", title: "Product One" },
        { id: "prod_2", title: "Product Two" },
      ];

      render(
        <DataTable
          columns={columns}
          data={data}
          getRowId={(row) => row.id}
          partialErrorState={{
            context: "partial",
            error: new AppError("Network glitch on refresh", {
              type: "network",
            }),
            severity: "warning",
            blocking: false,
            retryable: true,
            title: "Products may be out of date.",
            description: "We couldn't refresh the latest data.",
          }}
          onRetry={onRetry}
        />
      );

      // The existing table data is fully visible and rendered!
      expect(screen.getByText("Product One")).toBeTruthy();
      expect(screen.getByText("Product Two")).toBeTruthy();

      // Non-blocking warning banner is present
      const alert = screen.getByRole("alert");
      expect(alert).toBeTruthy();
      expect(screen.getByText("Products may be out of date.")).toBeTruthy();
      expect(
        screen.getByText("We couldn't refresh the latest data.")
      ).toBeTruthy();

      const retryBtn = screen.getByRole("button", { name: /retry/i });
      await user.click(retryBtn);
      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe("3. Authorization denied", () => {
    it("renders a restrained access-denied state and never leaks raw internal permission codes", () => {
      render(
        <ResourceErrorState
          state={{
            context: "authorization",
            error: new AppError("Forbidden", {
              type: "authorization",
              code: "catalog.products.read",
            }),
            severity: "error",
            blocking: true,
            retryable: false,
            title: "Access denied.",
            description: "You don't have access to Products.",
          }}
        />
      );

      const alert = screen.getByRole("alert");
      expect(alert).toBeTruthy();
      expect(screen.getByText("Access denied.")).toBeTruthy();
      expect(
        screen.getByText("You don't have access to Products.")
      ).toBeTruthy();

      // Ensure raw internal permission names are never displayed
      expect(screen.queryByText("catalog.products.read")).toBeNull();
      // Access denied is not retryable
      expect(screen.queryByRole("button", { name: /try again/i })).toBeNull();
    });

    it("renders standalone ResourceAccessDeniedState directly", () => {
      render(
        <ResourceAccessDeniedState
          title="You don't have access to Orders."
          description="Contact your store owner for permissions."
        />
      );

      expect(screen.getByText("You don't have access to Orders.")).toBeTruthy();
      expect(
        screen.getByText("Contact your store owner for permissions.")
      ).toBeTruthy();
    });
  });

  describe("4. Mutation errors", () => {
    it("renders mutation failure banner inside DeleteConfirmationDialog without full-screen takeover", () => {
      render(
        <DeleteConfirmationDialog
          open={true}
          onOpenChange={vi.fn()}
          entityName="Product Alpha"
          onConfirm={vi.fn()}
          errorState={{
            context: "delete",
            error: new AppError("Cannot delete product with active orders.", {
              type: "conflict",
            }),
            severity: "error",
            blocking: false,
            retryable: false,
            title: "Could not delete Product.",
            description: "Cannot delete product with active orders.",
          }}
        />
      );

      expect(screen.getByRole("alertdialog")).toBeTruthy();
      expect(screen.getByText("Could not delete Product.")).toBeTruthy();
      expect(
        screen.getByText("Cannot delete product with active orders.")
      ).toBeTruthy();
      expect(screen.getByRole("button", { name: /delete/i })).toBeTruthy();
    });

    it("renders contextual operation feedback for form/mutation surfaces", () => {
      render(
        <ResourceOperationFeedback
          error={{
            context: "update",
            error: new AppError("Invalid handle format", {
              type: "validation",
            }),
            severity: "error",
            blocking: false,
            retryable: false,
            title: "Could not update Category.",
            description: "Invalid handle format.",
          }}
        />
      );

      expect(screen.getByText("Could not update Category.")).toBeTruthy();
      expect(screen.getByText("Invalid handle format.")).toBeTruthy();
    });
  });

  describe("5. Form field errors", () => {
    const testSchema = z.object({
      sku: z.string().min(1, "SKU is required"),
    });

    function TestFormWithFieldErrors({
      onSubmitError,
    }: {
      onSubmitError?: (error: unknown, form: any) => void;
    }) {
      const form = useCoreForm<{ sku: string }>({
        formId: "test-sku-form",
        defaultValues: { sku: "ABC-123" },
        validators: { onSubmit: testSchema },
        onSubmit: async () => {
          const mutationErr = new AppError("Validation failed", {
            type: "validation",
            status: 422,
            fieldErrors: { sku: ["This SKU is already in use."] },
          });
          throw mutationErr;
        },
        onSubmitError: (err, currentForm) => {
          applyServerFieldErrors(currentForm, err as any);
          onSubmitError?.(err, currentForm);
        },
      });

      return (
        <CoreForm form={form} id="test-form">
          <form.AppField name="sku">
            {(field: any) => <field.Input label="SKU" />}
          </form.AppField>
          <button type="submit">Submit</button>
        </CoreForm>
      );
    }

    it("renders backend field-specific error next to corresponding input while preserving entered values", async () => {
      const user = userEvent.setup();
      render(<TestFormWithFieldErrors />);

      const input = screen.getByLabelText("SKU") as HTMLInputElement;
      expect(input.value).toBe("ABC-123");

      await user.click(screen.getByRole("button", { name: "Submit" }));

      await waitFor(() => {
        expect(screen.getByText("This SKU is already in use.")).toBeTruthy();
      });

      // Entered value is preserved
      expect(input.value).toBe("ABC-123");
      expect(input.getAttribute("aria-invalid")).toBe("true");
    });
  });

  describe("6. Partial bulk operation", () => {
    it("renders warning banner with partial success/failure breakdown", () => {
      render(
        <ResourceErrorBanner
          state={{
            context: "partial",
            error: new AppError("Some items could not be deleted", {
              type: "unknown",
            }),
            severity: "warning",
            blocking: false,
            retryable: false,
            title: "Products loaded with warnings.",
            description: "2 products could not be deleted.",
            partial: {
              succeededIds: ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8"],
              failedIds: ["p9", "p10"],
            },
          }}
        />
      );

      const alert = screen.getByRole("alert");
      expect(alert).toBeTruthy();
      expect(screen.getByText(/8 succeeded, 2 failed\./)).toBeTruthy();
      expect(screen.getByText("2 products could not be deleted.")).toBeTruthy();
    });
  });

  describe("7. Cancellation", () => {
    it("produces no user-visible error UI when the request was cancelled or aborted", () => {
      const { container: stateContainer } = render(
        <ResourceErrorState
          state={{
            context: "query",
            error: new AppError("AbortError", { type: "cancelled" }),
            severity: "error",
            blocking: true,
            retryable: false,
            title: "Cancelled",
            description: "Request was cancelled",
          }}
        />
      );
      expect(stateContainer.innerHTML).toBe("");

      const { container: bannerContainer } = render(
        <ResourceErrorBanner
          state={{
            context: "partial",
            error: new AppError("AbortError", { type: "cancelled" }),
            severity: "warning",
            blocking: false,
            retryable: false,
            title: "Cancelled",
            description: "Request was cancelled",
          }}
        />
      );
      expect(bannerContainer.innerHTML).toBe("");
    });
  });
});
