import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { z } from "zod";
import { describe, expect, it, vi } from "vitest";
import { AddressFields } from "../src/components/form/groups/address-fields";
import { renderForm, createAddress, readFormState } from "./form-test-utils";

describe("field groups and form controls", () => {
  it("updates nested address paths, conditionally renders billing, and resets all groups", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const defaults = {
      sameAsBilling: true,
      shipping_address: createAddress({ first_name: "", address_2: "" }),
      billing_address: createAddress({ first_name: "Billing" }),
    };
    const schema = z.object({
      sameAsBilling: z.boolean(),
      shipping_address: z.object({
        first_name: z.string().min(1, "First name is required"),
        last_name: z.string().min(1),
        company: z.string().optional(),
        address_1: z.string().min(1),
        address_2: z.string().optional(),
        city: z.string().min(1),
        province: z.string().optional(),
        postal_code: z.string().optional(),
        country_code: z.string().min(1),
        phone: z.string().optional(),
      }),
      billing_address: z.any(),
    });

    const { user: formUser } = renderForm({
      defaultValues: defaults,
      validators: { onChange: schema },
      onSubmit,
      children: (form) => (
        <>
          <form.AppField name="sameAsBilling">
            {(field: any) => <field.Switch label="Same as billing" />}
          </form.AppField>
          <AddressFields
            form={form as any}
            fields={"shipping_address" as any}
          />
          <form.Subscribe selector={(state: any) => state.values.sameAsBilling}>
            {(sameAsBilling: boolean) =>
              !sameAsBilling ? (
                <AddressFields
                  form={form as any}
                  fields={"billing_address" as any}
                />
              ) : null
            }
          </form.Subscribe>
          <form.FormErrorSummary />
          <form.ResetButton>Reset</form.ResetButton>
          <form.SubmitButton>Save</form.SubmitButton>
        </>
      ),
    });

    expect(screen.queryByLabelText(/First Name/)).toBeTruthy();
    expect(
      screen.queryByLabelText(/Apartment, suite, etc\. \(Optional\)/)
    ).toBeTruthy();
    await formUser.type(screen.getByLabelText(/First Name/), "Amira");
    await waitFor(() =>
      expect(readFormState()).toEqual(
        expect.objectContaining({
          shipping_address: expect.objectContaining({ first_name: "Amira" }),
        })
      )
    );

    await formUser.click(screen.getByLabelText("Same as billing"));
    await waitFor(() =>
      expect(screen.getAllByLabelText(/First Name/)).toHaveLength(2)
    );
    const names = screen.getAllByLabelText(/First Name/);
    await formUser.clear(names[1]!);
    await formUser.type(names[1]!, "Bill");
    expect(readFormState()).toEqual(
      expect.objectContaining({
        shipping_address: expect.objectContaining({ first_name: "Amira" }),
        billing_address: expect.objectContaining({ first_name: "Bill" }),
      })
    );

    await formUser.click(screen.getByRole("button", { name: "Reset" }));
    await waitFor(() => expect(readFormState()).toEqual(defaults));
    expect(screen.getAllByLabelText(/First Name/)).toHaveLength(1);

    fireEvent.submit(screen.getByRole("form"));
    await waitFor(() => expect(onSubmit).not.toHaveBeenCalled());
    expect(
      screen.getAllByText("First name is required").length
    ).toBeGreaterThan(0);
  });

  it("tracks dirty state, exposes submit loading, and preserves values on async failure/retry", async () => {
    const user = userEvent.setup();
    let rejectSubmit: ((reason: Error) => void) | undefined;
    let firstAttempt = true;
    const save = vi.fn(
      (_value: unknown) =>
        new Promise<void>((resolve, reject) => {
          if (firstAttempt) rejectSubmit = reject;
          else resolve();
        })
    );
    renderForm({
      defaultValues: { title: "Classic Shirt" },
      onSubmit: async (value) => {
        await save(value);
      },
      children: (form) => (
        <>
          <form.AppField name="title">
            {(field: any) => <field.Input label="Title" />}
          </form.AppField>
          <form.UnsavedChangesIndicator />
          <form.SubmitButton>Save</form.SubmitButton>
          <form.ResetButton>Reset</form.ResetButton>
        </>
      ),
    });

    await user.clear(screen.getByLabelText("Title"));
    await user.type(screen.getByLabelText("Title"), "Updated");
    expect(screen.getByText("Unsaved Changes")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(save).toHaveBeenCalledTimes(1);
      expect(
        screen.getByRole("button", { name: /Save/ }).hasAttribute("disabled")
      ).toBe(true);
    });
    rejectSubmit!(new Error("network error"));
    await waitFor(() =>
      expect((screen.getByLabelText("Title") as HTMLInputElement).value).toBe(
        "Updated"
      )
    );
    expect(screen.getByText("Unsaved Changes")).toBeTruthy();

    firstAttempt = false;
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(save).toHaveBeenCalledTimes(2));
  });
});
