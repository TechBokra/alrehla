import * as React from "react";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  DataViewFilterControls,
  mapDataViewFilterDefinitionsToReuiFields,
  mapFilterValuesToReuiFilters,
} from "../src/components/data-table/filters/data-view-filters";
import type { DataViewFilterDefinition } from "@eng-mohamedelsayed/admin-core/data-view";

describe("DataViewFilterControls with ReUI Filters", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const definitions: DataViewFilterDefinition[] = [
    {
      id: "status",
      label: "Status",
      type: "multi-select",
      options: [
        { label: "Active", value: "active" },
        { label: "Draft", value: "draft" },
      ],
    },
    {
      id: "search",
      label: "Search",
      type: "text",
    },
  ];

  it("correctly maps definitions and filter values to ReUI format", () => {
    const fields = mapDataViewFilterDefinitionsToReuiFields(definitions);
    expect(fields).toHaveLength(2);
    expect(fields[0]?.key).toBe("status");
    expect(fields[0]?.type).toBe("multiselect");
    expect(fields[1]?.key).toBe("search");
    expect(fields[1]?.type).toBe("text");

    const reuiFilters = mapFilterValuesToReuiFilters(
      { status: ["active", "draft"], search: "test" },
      definitions
    );
    expect(reuiFilters).toHaveLength(2);
    expect(reuiFilters[0]?.field).toBe("status");
    expect(reuiFilters[0]?.operator).toBe("is_any_of");
    expect(reuiFilters[0]?.values).toEqual(["active", "draft"]);
    expect(reuiFilters[1]?.field).toBe("search");
    expect(reuiFilters[1]?.operator).toBe("contains");
    expect(reuiFilters[1]?.values).toEqual(["test"]);
  });

  it("renders trigger button with active count badge and clear button", () => {
    const onChange = vi.fn();
    const onReset = vi.fn();

    render(
      <DataViewFilterControls
        definitions={definitions}
        values={{ status: ["active", "draft"] }}
        onChange={onChange}
        onReset={onReset}
        debounceMs={300}
      />
    );

    // Filter button with count badge and Clear button should be rendered
    expect(screen.getByText("Filter")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
    expect(screen.getByText("Clear")).toBeTruthy();

    // Clicking clear calls onReset immediately
    fireEvent.click(screen.getByText("Clear"));
    expect(onReset).toHaveBeenCalled();
  });
});
