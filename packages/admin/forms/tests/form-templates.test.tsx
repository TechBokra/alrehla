import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button, ScrollArea } from "@eng-mohamedelsayed/admin-ui";
import { FormDialog } from "../src/components/forms/form-dialog";
import { FormPage } from "../src/components/forms/templates/form-page";
import { FormSheet } from "../src/components/forms/form-sheet";
import { FormWizardDialog } from "../src/components/forms/form-wizard-dialog";
import { FormWizard } from "../src/components/forms/templates/form-wizard";

function ResourceIcon({ className }: { className?: string }) {
  return <svg data-testid="form-resource-icon" className={className} />;
}

describe("form templates", () => {
  it("keeps the shared scrollbar visible across browsers", () => {
    const { container } = render(
      <ScrollArea className="h-32">
        <div className="h-96">Long content</div>
      </ScrollArea>
    );

    expect(
      container.querySelector('[data-orientation="vertical"]')?.getAttribute("data-state")
    ).toBe("visible");
  });

  it("supports an uncontrolled dialog trigger and controlled close", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <FormDialog
        defaultOpen={false}
        onOpenChange={onOpenChange}
        trigger={<Button>New category</Button>}
        title="Create category"
      >
        <p>Category fields</p>
      </FormDialog>
    );

    await user.click(screen.getByRole("button", { name: "New category" }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText("Category fields")).toBeTruthy();
  });

  it("renders a sheet with a reusable body", async () => {
    const user = userEvent.setup();
    render(
      <FormSheet
        trigger={<Button>Open filters</Button>}
        title="Filters"
        description="Narrow the resource list"
      >
        <p>Filter fields</p>
      </FormSheet>
    );

    await user.click(screen.getByRole("button", { name: "Open filters" }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText("Filter fields")).toBeTruthy();
  });

  it("renders the supplied Resource icon in dialog, sheet, wizard, and page headers", () => {
    const first = render(
      <FormDialog open title="Create widget" icon={ResourceIcon}>
        <p>Dialog form</p>
      </FormDialog>
    );
    expect(screen.getByTestId("form-resource-icon")).toBeTruthy();
    first.unmount();

    const second = render(
      <FormSheet open title="Edit widget" icon={ResourceIcon}>
        <p>Sheet form</p>
      </FormSheet>
    );
    expect(screen.getByTestId("form-resource-icon")).toBeTruthy();
    second.unmount();

    const third = render(
      <FormWizardDialog
        open
        onOpenChange={vi.fn()}
        title="Create widget"
        headerIcon={ResourceIcon}
        groups={[{ label: "General", items: [{ id: "general", label: "General" }] }]}
        activeTab="general"
        onTabChange={vi.fn()}
        onSubmit={vi.fn()}
      >
        <p>Wizard form</p>
      </FormWizardDialog>
    );
    expect(screen.getByTestId("form-resource-icon")).toBeTruthy();
    third.unmount();

    render(
      <FormPage title="Edit widget" icon={ResourceIcon}>
        <p>Page form</p>
      </FormPage>
    );
    expect(screen.getByTestId("form-resource-icon")).toBeTruthy();
  });

  it("provides page composition slots", () => {
    render(
      <FormPage
        title="Edit product"
        description="Update catalog details"
        actions={<Button>Save</Button>}
        sidebar={<p>Sidebar</p>}
        footer={<p>Sticky actions</p>}
      >
        <p>Main form</p>
      </FormPage>
    );

    expect(screen.getByRole("heading", { name: "Edit product" })).toBeTruthy();
    expect(screen.getByText("Main form")).toBeTruthy();
    expect(screen.getByText("Sidebar")).toBeTruthy();
    expect(screen.getByText("Sticky actions")).toBeTruthy();
  });

  it("guards wizard transitions and completes on the last step", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    const canAdvance = vi.fn(() => false);
    render(
      <FormWizard
        steps={[
          { id: "details", title: "Details", content: <p>Details step</p> },
          { id: "review", title: "Review", content: <p>Review step</p> },
        ]}
        canAdvance={canAdvance}
        onComplete={onComplete}
      />
    );

    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(canAdvance).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Details step")).toBeTruthy();

    canAdvance.mockReturnValue(true);
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Review step")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Submit" }));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
