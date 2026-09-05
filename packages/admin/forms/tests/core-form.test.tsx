import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { z } from "zod";
import { describe, expect, it, vi } from "vitest";
import {
  CoreForm,
  CoreFormError,
  setCoreFormError,
  useCoreForm,
  useCoreFormSubscription,
} from "../src/components/forms";

interface Values {
  name: string;
}

function TestCoreForm({
  onSubmit,
  onSubmitError,
}: {
  onSubmit: (value: Values) => void | Promise<void>;
  onSubmitError?: (
    error: unknown,
    form: Parameters<typeof setCoreFormError>[0]
  ) => void;
}) {
  const form = useCoreForm<Values>({
    defaultValues: { name: "" },
    validators: {
      onSubmit: z.object({ name: z.string().min(1, "Name is required") }),
    },
    onSubmit,
    ...(onSubmitError ? { onSubmitError } : {}),
  });

  return (
    <CoreForm form={form}>
      <CoreFormError form={form} />
      <form.AppField name="name">
        {(field: any) => <field.Input label="Name" required />}
      </form.AppField>
      <form.SubmitButton>Save</form.SubmitButton>
    </CoreForm>
  );
}

describe("CoreForm", () => {
  it("exposes form subscriptions without leaking TanStack Form to consumers", async () => {
    function SubscriptionHarness() {
      const form = useCoreForm({
        defaultValues: { name: "Catalog" },
        onSubmit: async () => undefined,
      });
      const errorMap = useCoreFormSubscription(form, (state) => state.errorMap);

      return (
        <CoreForm form={form}>
          <output data-testid="subscription-state">
            {JSON.stringify(errorMap)}
          </output>
          <button
            type="button"
            onClick={() =>
              setCoreFormError(form, {
                form: "The catalog could not be saved",
                fields: { name: "Name is already in use" },
              })
            }
          >
            Set server error
          </button>
        </CoreForm>
      );
    }

    const user = userEvent.setup();
    render(<SubscriptionHarness />);
    await user.click(screen.getByRole("button", { name: "Set server error" }));
    await waitFor(() => {
      expect(screen.getByTestId("subscription-state").textContent).toContain(
        "catalog could not be saved"
      );
    });
  });

  it("blocks invalid submission and renders field errors", async () => {
    const onSubmit = vi.fn();
    render(<TestCoreForm onSubmit={onSubmit} />);

    fireEvent.submit(document.querySelector("form") as HTMLFormElement);

    await waitFor(() => {
      expect(screen.getAllByText("Name is required").length).toBeGreaterThan(0);
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("awaits one submission and disables the submit control while pending", async () => {
    const user = userEvent.setup();
    let resolveSubmit: (() => void) | undefined;
    const onSubmit = vi.fn(
      () => new Promise<void>((resolve) => (resolveSubmit = resolve))
    );
    render(<TestCoreForm onSubmit={onSubmit} />);

    await user.type(screen.getByRole("textbox", { name: /Name/ }), "Books");
    const save = screen.getByRole("button", { name: "Save" });
    await user.click(save);
    await user.click(save);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect((save as HTMLButtonElement).disabled).toBe(true);
    resolveSubmit?.();
    await waitFor(() =>
      expect((save as HTMLButtonElement).disabled).toBe(false)
    );
  });

  it("renders normalized server form and field errors", async () => {
    const onSubmit = vi.fn(async () => {
      throw new Error("Request failed");
    });
    render(
      <TestCoreForm
        onSubmit={onSubmit}
        onSubmitError={(_, form) =>
          setCoreFormError(form, {
            form: "Category could not be saved",
            fields: { name: "A category with this name already exists" },
          })
        }
      />
    );

    const user = userEvent.setup();
    await user.type(screen.getByRole("textbox", { name: /Name/ }), "Books");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(screen.getByText("Category could not be saved")).toBeTruthy();
      expect(
        screen.getAllByText("A category with this name already exists").length
      ).toBeGreaterThan(0);
    });
  });
});
