import { describe, expect, it } from "vitest";
import {
  builtInViewRegistry,
  composeViewRegistries,
  createViewRegistry,
  type ViewRegistration,
} from "../src/data-view";

const renderer = (() => null) as ViewRegistration["renderer"];

function registration(type: string): ViewRegistration {
  return {
    type,
    label: type,
    capabilities: {},
    renderer,
  };
}

describe("DataView view registry", () => {
  it("exposes the built-in Table renderer through the runtime entrypoint", () => {
    expect(builtInViewRegistry.get("table")?.type).toBe("table");
    expect(builtInViewRegistry.get("table")?.renderer).toBeDefined();
  });

  it("looks up registrations and composes independent registries", () => {
    const builtIn = createViewRegistry([registration("table")]);
    const extension = createViewRegistry([registration("calendar")]);
    const composed = composeViewRegistries(builtIn, extension);

    expect(composed.get("table")).toBeDefined();
    expect(composed.get("calendar")).toBeDefined();
    expect(composed.registrations).toHaveLength(2);
  });

  it("rejects duplicate view types instead of replacing renderers", () => {
    expect(() =>
      createViewRegistry([registration("table"), registration("table")])
    ).toThrow('Duplicate DataView view registration for type "table".');
    expect(() =>
      composeViewRegistries(
        createViewRegistry([registration("table")]),
        createViewRegistry([registration("table")])
      )
    ).toThrow('Duplicate DataView view registration for type "table".');
  });

  it("exports calendarViewRegistration with non-paginated and non-selection capabilities", async () => {
    const { calendarViewRegistration } = await import("../src/data-view");
    expect(calendarViewRegistration.type).toBe("calendar");
    expect(calendarViewRegistration.capabilities.pagination).toBe(false);
    expect(calendarViewRegistration.capabilities.selection).toBe(false);
    expect(calendarViewRegistration.capabilities.bulkActions).toBe(false);
    expect(calendarViewRegistration.capabilities.reordering).toBe(false);
    expect(calendarViewRegistration.capabilities.dateRange).toBe(true);
    expect(calendarViewRegistration.renderer).toBeDefined();
  });
});
