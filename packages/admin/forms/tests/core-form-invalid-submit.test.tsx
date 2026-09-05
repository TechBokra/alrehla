import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { z } from "zod";
import { describe, expect, it, vi } from "vitest";
import { CoreForm, useCoreForm } from "../src/components/forms";

describe("CoreForm invalid-submit contract", () => {
  it("exposes normalized errors without coupling the form to wizard navigation", async () => {
    const onInvalid = vi.fn();

    function Harness() {
      const form = useCoreForm<{ title: string }>({
        defaultValues: { title: "" },
        validators: {
          onSubmit: z.object({ title: z.string().min(1, "Title is required") }),
        },
        onSubmit: async () => undefined,
        onSubmitInvalid: onInvalid,
      });

      return (
        <CoreForm form={form}>
          <form.AppField name="title">
            {(field: any) => <field.Input label="Title" />}
          </form.AppField>
          <button type="submit">Save</button>
        </CoreForm>
      );
    }

    render(<Harness />);
    fireEvent.submit(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(onInvalid).toHaveBeenCalledTimes(1));
    expect(onInvalid.mock.calls[0]?.[0]).toMatchObject({
      firstInvalidFieldPath: "title",
      errors: [
        {
          fieldPath: "title",
          message: "Title is required",
          source: "validation",
        },
      ],
    });
  });
});
