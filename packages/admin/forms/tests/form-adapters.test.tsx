import { fireEvent, screen, waitFor } from "@testing-library/react";
import { z } from "zod";
import { describe, expect, it, vi } from "vitest";
import { readFormState, renderForm, waitForState } from "./form-test-utils";

const selectOptions = [
  { value: "physical", label: "Physical" },
  { value: "digital", label: "Digital" },
];

describe("TanStack form adapters", () => {
  it("bridges string, number, boolean, array, and nested defaults through AppField", async () => {
    const onSubmit = vi.fn();
    const defaults = {
      title: "Classic Shirt",
      price: 0,
      enabled: false,
      tags: ["summer"],
      address: { city: "Giza", country_code: "EG" },
    };

    const { user } = renderForm({
      defaultValues: defaults,
      onSubmit,
      children: (form) => (
        <>
          <form.AppField name="title">
            {(field: any) => (
              <field.Input
                label="Title"
                description="Product name"
                placeholder="Product title"
                required
              />
            )}
          </form.AppField>
          <form.AppField name="price">
            {(field: any) => <field.Number label="Price" min={0} />}
          </form.AppField>
          <form.AppField name="enabled">
            {(field: any) => <field.Switch label="Enabled" />}
          </form.AppField>
          <form.AppField name="tags">
            {(field: any) => <field.Tags label="Tags" />}
          </form.AppField>
          <form.AppField name="address.city">
            {(field: any) => <field.Input label="City" />}
          </form.AppField>
          <form.SubmitButton>Submit</form.SubmitButton>
          <form.ResetButton>Reset</form.ResetButton>
        </>
      ),
    });

    expect(
      (screen.getByRole("textbox", { name: /Title/ }) as HTMLInputElement).value
    ).toBe("Classic Shirt");
    expect(
      (screen.getByRole("spinbutton", { name: /Price/ }) as HTMLInputElement)
        .value
    ).toBe("0");
    expect(
      (screen.getByLabelText("Enabled") as HTMLButtonElement).getAttribute(
        "aria-checked"
      )
    ).toBe("false");
    expect(screen.getByText("summer")).toBeTruthy();
    expect(
      (screen.getByRole("textbox", { name: "City" }) as HTMLInputElement).value
    ).toBe("Giza");

    const title = screen.getByRole("textbox", { name: /Title/ });
    await user.clear(title);
    await user.type(title, "Premium Shirt");
    await user.click(screen.getByLabelText("Enabled"));

    const price = screen.getByRole("spinbutton", { name: /Price/ });
    await user.clear(price);
    await user.type(price, "0");
    await waitForState({ title: "Premium Shirt", price: 0, enabled: true });

    const tagsInput = screen.getByLabelText("Tags");
    await user.type(tagsInput, "cotton{Enter}");
    await waitForState({ tags: ["summer", "cotton"] });

    await user.click(screen.getByRole("button", { name: "Reset" }));
    await waitFor(() => {
      expect(readFormState()).toEqual(defaults);
      expect(
        (screen.getByRole("textbox", { name: /Title/ }) as HTMLInputElement)
          .value
      ).toBe("Classic Shirt");
    });
    expect(screen.getByTestId("form-meta").textContent).toContain(
      '"isDirty":false'
    );

    fireEvent.submit(screen.getByRole("form"));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith(defaults);
  });

  it("runs Zod validation, renders accessible errors, recovers, and blocks invalid submission", async () => {
    const onSubmit = vi.fn();
    const requiredOptionalSchema = z.object({
      required: z.string().min(1),
      optional: z.string().optional(),
    });
    expect(requiredOptionalSchema.safeParse({ required: "ok" }).success).toBe(
      true
    );
    expect(requiredOptionalSchema.safeParse({ required: "" }).success).toBe(
      false
    );
    const schema = z.object({
      title: z.string().min(3, "Title must be at least 3 characters"),
      price: z.number().min(0, "Price cannot be negative"),
      category: z.string().min(1, "Category is required"),
    });

    const { user } = renderForm({
      defaultValues: { title: "", price: undefined, category: "" },
      validators: { onChange: schema },
      onSubmit,
      children: (form) => (
        <>
          <form.FormErrorSummary />
          <form.AppField name="title">
            {(field: any) => <field.Input label="Title" required />}
          </form.AppField>
          <form.AppField name="price">
            {(field: any) => <field.Number label="Price" required />}
          </form.AppField>
          <form.AppField name="category">
            {(field: any) => <field.Input label="Category" required />}
          </form.AppField>
          <form.SubmitButton>Submit</form.SubmitButton>
        </>
      ),
    });

    fireEvent.submit(screen.getByRole("form"));
    await waitFor(() => {
      expect(screen.getAllByRole("alert").length).toBeGreaterThan(0);
      expect(
        screen.getAllByText("Title must be at least 3 characters").length
      ).toBeGreaterThan(0);
      expect(
        screen.getAllByText("Category is required").length
      ).toBeGreaterThan(0);
    });
    expect(onSubmit).not.toHaveBeenCalled();
    expect(
      screen
        .getByRole("textbox", { name: /Title/ })
        .getAttribute("aria-invalid")
    ).toBe("true");

    await user.type(screen.getByRole("textbox", { name: /Title/ }), "abc");
    await user.type(screen.getByRole("spinbutton", { name: /Price/ }), "0");
    await user.type(
      screen.getByRole("textbox", { name: /Category/ }),
      "Clothing"
    );
    await waitFor(() => {
      expect(
        screen.queryByText("Title must be at least 3 characters")
      ).toBeNull();
      expect(screen.queryByText("Category is required")).toBeNull();
    });

    await user.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith({
      title: "abc",
      price: 0,
      category: "Clothing",
    });
  });

  it("preserves exact select, checkbox, switch, radio, and combobox output types", async () => {
    const onSubmit = vi.fn();
    const { user } = renderForm({
      defaultValues: {
        kind: "physical",
        accepted: false,
        enabled: false,
        shipping: "standard",
        framework: "",
      },
      onSubmit,
      children: (form) => (
        <>
          <form.AppField name="kind">
            {(field: any) => (
              <field.Select label="Kind" options={selectOptions} />
            )}
          </form.AppField>
          <form.AppField name="accepted">
            {(field: any) => <field.Checkbox label="Accepted" />}
          </form.AppField>
          <form.AppField name="enabled">
            {(field: any) => <field.Switch label="Enabled" />}
          </form.AppField>
          <form.AppField name="shipping">
            {(field: any) => (
              <field.RadioGroup
                label="Shipping"
                options={[
                  { value: "standard", label: "Standard" },
                  { value: "express", label: "Express" },
                ]}
              />
            )}
          </form.AppField>
          <form.AppField name="framework">
            {(field: any) => (
              <field.Combobox
                label="Framework"
                options={[
                  { value: "next", label: "Next.js" },
                  { value: "remix", label: "Remix" },
                ]}
              />
            )}
          </form.AppField>
        </>
      ),
    });

    await user.click(screen.getByRole("combobox", { name: "Kind" }));
    await user.click(screen.getByRole("option", { name: "Digital" }));
    await user.click(screen.getByLabelText("Accepted"));
    await user.click(screen.getByLabelText("Enabled"));
    await user.click(screen.getByLabelText("Express"));

    await user.click(screen.getByRole("combobox", { name: "Framework" }));
    await waitFor(() => expect(screen.getByText("Next.js")).toBeTruthy());
    await user.click(screen.getByText("Next.js"));

    await waitFor(() =>
      expect(readFormState()).toEqual({
        kind: "digital",
        accepted: true,
        enabled: true,
        shipping: "express",
        framework: "next",
      })
    );
  });

  it("binds reusable checkbox groups and string lists with validation and accessible errors", async () => {
    const onSubmit = vi.fn();
    const { user } = renderForm({
      defaultValues: { permissions: [], tags: [], locked: [] },
      validators: {
        onSubmit: z.object({
          permissions: z
            .array(z.string())
            .min(1, "Select at least one permission"),
          tags: z.array(z.string()).min(1, "Add at least one tag"),
          locked: z.array(z.string()),
        }),
      },
      onSubmit,
      children: (form) => (
        <>
          <form.AppField name="permissions">
            {(field: any) => (
              <field.CheckboxGroup
                label="Permissions"
                description="Choose the permissions for this role."
                required
                options={[
                  { value: "read", label: "Read" },
                  { value: "write", label: "Write" },
                ]}
              />
            )}
          </form.AppField>
          <form.AppField name="tags">
            {(field: any) => (
              <field.StringList
                label="Tags"
                description="Comma-separated tags."
                placeholder="summer, cotton"
              />
            )}
          </form.AppField>
          <form.AppField name="locked">
            {(field: any) => (
              <field.CheckboxGroup
                label="Locked permissions"
                disabled
                options={[{ value: "admin", label: "Admin" }]}
              />
            )}
          </form.AppField>
          <form.SubmitButton>Submit</form.SubmitButton>
        </>
      ),
    });

    const read = screen.getByRole("checkbox", { name: "Read" });
    expect(read.getAttribute("disabled")).toBeNull();
    fireEvent.submit(screen.getByRole("form"));
    await waitFor(() => {
      expect(screen.getByText("Select at least one permission")).toBeTruthy();
      expect(screen.getByText("Add at least one tag")).toBeTruthy();
    });
    expect(read.getAttribute("aria-invalid")).toBe("true");
    expect(
      screen
        .getByRole("textbox", { name: "Tags" })
        .getAttribute("aria-describedby")
    ).toContain("tags-error");

    await user.click(read);
    fireEvent.change(screen.getByRole("textbox", { name: "Tags" }), {
      target: { value: "summer, cotton" },
    });
    await waitForState({ permissions: ["read"], tags: ["summer", "cotton"] });

    const locked = screen.getByRole("checkbox", { name: "Admin" });
    expect(locked.getAttribute("disabled")).not.toBeNull();
    expect(
      screen
        .getByRole("textbox", { name: "Tags" })
        .getAttribute("aria-describedby")
    ).toContain("tags-description");

    await user.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  });
});
