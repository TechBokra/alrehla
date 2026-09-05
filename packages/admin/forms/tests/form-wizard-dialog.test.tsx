import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  FormWizardDialog,
  type FormWizardTabGroup,
} from "../src/components/forms/form-wizard-dialog";

describe("FormWizardDialog section indicators and navigation", () => {
  const groups: FormWizardTabGroup[] = [
    {
      label: "PRODUCT",
      items: [
        {
          id: "general",
          label: "General",
          errorCount: 0,
          hasError: false,
        },
        {
          id: "organization",
          label: "Organization",
          errorCount: 1,
          hasError: true,
        },
      ],
    },
    {
      label: "CONTENT",
      items: [
        {
          id: "variants",
          label: "Variants",
          errorCount: 3,
          hasError: true,
        },
        {
          id: "media",
          label: "Media",
          errorCount: 120,
          hasError: true,
        },
      ],
    },
  ];

  it("renders accessible section labels and badges with error counts", () => {
    const onTabChange = vi.fn();
    render(
      <FormWizardDialog
        open={true}
        onOpenChange={() => undefined}
        title="Edit Product"
        groups={groups}
        activeTab="general"
        onTabChange={onTabChange}
        onSubmit={() => undefined}
      >
        <div>Content</div>
      </FormWizardDialog>
    );

    // Desktop sidebar buttons
    const generalButtons = screen.getAllByRole("button", { name: "General" });
    expect(generalButtons.length).toBeGreaterThan(0);

    const orgButtons = screen.getAllByRole("button", {
      name: "Organization, 1 error",
    });
    expect(orgButtons.length).toBeGreaterThan(0);

    const variantsButtons = screen.getAllByRole("button", {
      name: "Variants, 3 errors",
    });
    expect(variantsButtons.length).toBeGreaterThan(0);

    // 99+ cap
    const mediaButtons = screen.getAllByRole("button", {
      name: "Media, 120 errors",
    });
    expect(mediaButtons.length).toBeGreaterThan(0);
    expect(screen.getAllByText("99+").length).toBeGreaterThan(0);
  });

  it("switches tabs when clicking navigation buttons", async () => {
    const user = userEvent.setup();
    const onTabChange = vi.fn();
    render(
      <FormWizardDialog
        open={true}
        onOpenChange={() => undefined}
        title="Edit Product"
        groups={groups}
        activeTab="general"
        onTabChange={onTabChange}
        onSubmit={() => undefined}
      >
        <div>Content</div>
      </FormWizardDialog>
    );

    const nextBtn = screen.getByRole("button", { name: "Next section" });
    await user.click(nextBtn);
    expect(onTabChange).toHaveBeenCalledWith("organization");

    const variantsBtn = screen.getAllByRole("button", {
      name: "Variants, 3 errors",
    })[0];
    if (variantsBtn) {
      await user.click(variantsBtn);
      expect(onTabChange).toHaveBeenCalledWith("variants");
    }
  });

  it("renders mobile tablist navigation with error indicators", () => {
    render(
      <FormWizardDialog
        open={true}
        onOpenChange={() => undefined}
        title="Edit Product"
        groups={groups}
        activeTab="variants"
        onTabChange={() => undefined}
        onSubmit={() => undefined}
      >
        <div>Content</div>
      </FormWizardDialog>
    );

    const tablist = screen.getByRole("tablist", { name: "Form sections" });
    expect(tablist).toBeTruthy();

    const activeTab = screen.getByRole("tab", {
      name: "Variants, 3 errors",
    });
    expect(activeTab.getAttribute("aria-selected")).toBe("true");
  });
});
