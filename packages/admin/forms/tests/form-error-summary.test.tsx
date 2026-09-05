import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  CoreForm,
  CoreFormError,
  setCoreFormError,
  useCoreForm,
} from "../src/components/forms";
import { formatFieldPathLabel } from "../src/components/form/components/form-error-summary";

describe("form error summary and recovery", () => {
  it("renders form and field failures with a caller-owned recovery action", async () => {
    const user = userEvent.setup();
    const onRecover = vi.fn();
    function Harness() {
      const form = useCoreForm({
        defaultValues: { name: "Shoes" },
        onSubmit: async () => undefined,
      });

      return (
        <CoreForm form={form}>
          <CoreFormError
            form={form}
            action={
              <button type="button" onClick={onRecover}>
                Reload record and retry
              </button>
            }
          />
          <button
            type="button"
            onClick={() =>
              setCoreFormError(form, {
                form: "The record changed before it could be saved.",
                fields: { name: "Reload the record and retry." },
              })
            }
          >
            Show conflict
          </button>
        </CoreForm>
      );
    }

    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "Show conflict" }));

    expect(
      screen.getByText("The record changed before it could be saved.")
    ).toBeTruthy();
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Reload record and retry" })
    ).toBeTruthy();
    await user.click(
      screen.getByRole("button", { name: "Reload record and retry" })
    );
    expect(onRecover).toHaveBeenCalledTimes(1);
  });

  it("derives error counts for single and multiple field errors", async () => {
    const user = userEvent.setup();
    function Harness() {
      const form = useCoreForm({
        defaultValues: { title: "", handle: "", "variants[1].sku": "" },
        onSubmit: async () => undefined,
      });

      return (
        <CoreForm form={form}>
          <CoreFormError form={form} />
          <form.AppField name="title">
            {(field: any) => <field.Input label="Title" />}
          </form.AppField>
          <form.AppField name="handle">
            {(field: any) => <field.Input label="Handle" />}
          </form.AppField>
          <form.AppField name="variants[1].sku">
            {(field: any) => <field.Input label="Variant SKU" />}
          </form.AppField>
          <button
            type="button"
            onClick={() =>
              setCoreFormError(form, {
                fields: {
                  title: "Title is required",
                  handle: "Handle already exists",
                  "variants[1].sku": "SKU must be unique",
                },
              })
            }
          >
            Show errors
          </button>
        </CoreForm>
      );
    }

    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "Show errors" }));

    await waitFor(() => {
      expect(screen.getByText("3 fields need your attention.")).toBeTruthy();
      expect(screen.getAllByText("Title is required").length).toBeGreaterThan(
        0
      );
    });
  });

  it("handles actionable error item click with onSelectField", async () => {
    const user = userEvent.setup();
    const onSelectField = vi.fn();

    function Harness() {
      const form = useCoreForm({
        defaultValues: { "variants[2].sku": "" },
        onSubmit: async () => undefined,
      });

      return (
        <CoreForm form={form}>
          <CoreFormError form={form} onSelectField={onSelectField} />
          <form.AppField name="variants[2].sku">
            {(field: any) => <field.Input label="Variant SKU" />}
          </form.AppField>
          <button
            type="button"
            onClick={() =>
              setCoreFormError(form, {
                fields: { "variants[2].sku": "SKU must be unique" },
              })
            }
          >
            Show error
          </button>
        </CoreForm>
      );
    }

    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "Show error" }));

    await waitFor(() => {
      expect(screen.getByText("1 field needs your attention.")).toBeTruthy();
    });
    const errorBtn = screen.getByRole("button", {
      name: /Variants 3 Sku: SKU must be unique/i,
    });
    expect(errorBtn).toBeTruthy();

    await user.click(errorBtn);
    expect(onSelectField).toHaveBeenCalledWith(
      "variants[2].sku",
      expect.objectContaining({
        fieldPath: "variants[2].sku",
        message: "SKU must be unique",
      })
    );
  });

  it("formats nested and indexed field paths with humanized 1-based labels", () => {
    expect(formatFieldPathLabel("variants[0].sku")).toBe("Variants 1 Sku");
    expect(formatFieldPathLabel("options[2].title")).toBe("Options 3 Title");
    expect(formatFieldPathLabel("category_ids")).toBe("Category Ids");
    expect(formatFieldPathLabel("")).toBe("Form");
  });
});
