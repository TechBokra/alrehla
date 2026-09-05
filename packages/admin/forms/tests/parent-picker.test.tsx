import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ParentPicker, type ParentEntity } from "../src/components/fields/pickers/parent-picker";
import { useAppForm } from "../src/components/form/hooks";
import { HierarchyFields } from "../src/components/form/groups/hierarchy-fields";

const mockItems: ParentEntity[] = [
  { id: "clothing", name: "Clothing", path: ["Clothing"], depth: 0, itemCount: 12 },
  { id: "shirts", name: "Shirts", path: ["Clothing", "Shirts"], depth: 1, parentId: "clothing", itemCount: 5 },
  { id: "tshirts", name: "T-Shirts", path: ["Clothing", "Shirts", "T-Shirts"], depth: 2, parentId: "shirts", itemCount: 3 },
  { id: "electronics", name: "Electronics", path: ["Electronics"], depth: 0, itemCount: 8 },
];

describe("ParentPicker", () => {
  it("renders with root option and displays selected path breadcrumb", () => {
    render(
      <ParentPicker
        items={mockItems}
        value="shirts"
      />
    );

    expect(screen.getByText("Clothing")).toBeTruthy();
    expect(screen.getByText("Shirts")).toBeTruthy();
  });

  it("renders 'No parent (Root level)' when value is empty and allowRoot is true", () => {
    render(
      <ParentPicker
        items={mockItems}
        value=""
        allowRoot={true}
      />
    );

    expect(screen.getByText("No parent (Root level)")).toBeTruthy();
  });

  it("allows selecting root or a parent option and calls onChange", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <ParentPicker
        items={mockItems}
        value=""
        onChange={onChange}
      />
    );

    await user.click(screen.getByRole("combobox"));
    expect(screen.getByText("Electronics")).toBeTruthy();

    await user.click(screen.getByText("Electronics"));
    expect(onChange).toHaveBeenCalledWith("electronics", expect.objectContaining({ id: "electronics" }));
  });

  it("excludes current entity and descendants from selectable options", async () => {
    const user = userEvent.setup();
    render(
      <ParentPicker
        items={mockItems}
        value=""
        currentId="clothing"
        excludeIds={["shirts", "tshirts"]}
      />
    );

    await user.click(screen.getByRole("combobox"));
    const options = screen.getAllByText("Clothing");
    const clothingOption = options
      .map((el) => el.closest("[role='option']"))
      .find(Boolean);
    expect(clothingOption?.getAttribute("aria-disabled")).toBe("true");
  });
});

describe("FormOrder and HierarchyFields", () => {
  function HierarchyFormTest({ onSubmit }: { onSubmit: (values: any) => void }) {
    const form = useAppForm({
      defaultValues: {
        parent_id: "clothing",
        sort_order: 2,
      },
      onSubmit: async ({ value }) => onSubmit(value),
    });

    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <HierarchyFields
          form={form as any}
          fields={{
            parent_id: "parent_id",
            sort_order: "sort_order",
          } as any}
          parentItems={mockItems}
          parentFieldName="parent_id"
          orderFieldName="sort_order"
        />
        <button type="submit">Submit</button>
      </form>
    );
  }

  it("renders parent picker and order steppers within HierarchyFields group in select mode", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    function HierarchyFormSelectTest({ onSubmit }: { onSubmit: (values: any) => void }) {
      const form = useAppForm({
        defaultValues: {
          parent_id: "clothing",
          sort_order: 2,
        },
        onSubmit: async ({ value }) => onSubmit(value),
      });

      return (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <HierarchyFields
            form={form as any}
            fields={{
              parent_id: "parent_id",
              sort_order: "sort_order",
            } as any}
            mode="select"
            parentItems={mockItems}
            parentFieldName="parent_id"
            orderFieldName="sort_order"
          />
          <button type="submit">Submit</button>
        </form>
      );
    }

    render(<HierarchyFormSelectTest onSubmit={onSubmit} />);

    expect(screen.getByText("Hierarchy & Placement")).toBeTruthy();
    expect(screen.getByText("Parent Resource")).toBeTruthy();
    expect(screen.getByText("Sort Order")).toBeTruthy();

    const orderInput = screen.getByRole("spinbutton") as HTMLInputElement;
    expect(orderInput.value).toBe("2");

    const plusBtn = screen.getByRole("button", { name: "Increase order" });
    await user.click(plusBtn);
    expect(orderInput.value).toBe("3");

    const minusBtn = screen.getByRole("button", { name: "Decrease order" });
    await user.click(minusBtn);
    expect(orderInput.value).toBe("2");
  });

  it("renders drag-and-drop data table in HierarchyFields data-table mode and updates parent", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<HierarchyFormTest onSubmit={onSubmit} />);

    expect(screen.getByText("Hierarchy & Placement")).toBeTruthy();
    expect(screen.getByText("Currently under:")).toBeTruthy();
    expect(screen.getByText("Root Level")).toBeTruthy();
    expect(screen.getAllByText("Clothing").length).toBeGreaterThan(0);

    // Click 'Root Level' button to set root
    await user.click(screen.getByText("Root Level"));

    await user.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          parent_id: null,
          sort_order: 0,
        })
      );
    });
  });
});

