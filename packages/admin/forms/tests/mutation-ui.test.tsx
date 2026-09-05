import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DeleteConfirmDialog } from "@eng-mohamedelsayed/admin-ui/components/feedback/delete-confirmation-dialog";
import { Button } from "@eng-mohamedelsayed/admin-ui/components/ui/button";

describe("DeleteConfirmDialog", () => {
  it("requires confirmation before invoking the mutation", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(
      <DeleteConfirmDialog
        title="Delete category?"
        description="This cannot be undone."
        onConfirm={onConfirm}
      >
        <Button>Delete category</Button>
      </DeleteConfirmDialog>
    );

    await user.click(screen.getByRole("button", { name: "Delete category" }));
    expect(screen.getByText("Delete category?")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onConfirm).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Delete category" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("disables both dialog actions while pending", async () => {
    const user = userEvent.setup();

    render(
      <DeleteConfirmDialog isPending onConfirm={vi.fn()}>
        <Button>Open delete</Button>
      </DeleteConfirmDialog>
    );

    await user.click(screen.getByRole("button", { name: "Open delete" }));
    expect(screen.getByRole("alertdialog")).toBeTruthy();
    expect(screen.getByText("This action cannot be undone.")).toBeTruthy();
    expect(
      (screen.getByRole("button", { name: "Cancel" }) as HTMLButtonElement)
        .disabled
    ).toBe(true);
    expect(
      (screen.getByRole("button", { name: "Deleting..." }) as HTMLButtonElement)
        .disabled
    ).toBe(true);
  });
});
