import { describe, expect, it } from "vitest";
import {
  getResourceFormSectionOwnership,
  getResourceFormOwnership,
  type ResourceFormSection,
} from "../src/resource";

type Values = {
  title: string;
  metadata: { description: string };
};

describe("resource form section ownership", () => {
  it("derives registered field names and keeps custom ownership explicit", () => {
    const sections: ResourceFormSection<undefined, Values>[] = [
      {
        id: "general",
        fields: [{ field: "Input", name: "title" }],
      },
      {
        id: "details",
        ownership: { fieldPrefixes: ["metadata"] },
      },
    ];

    expect(getResourceFormSectionOwnership(sections[0]!)).toEqual({
      id: "general",
      fields: ["title"],
    });
    expect(getResourceFormOwnership(sections)).toEqual([
      { id: "general", fields: ["title"] },
      { id: "details", fieldPrefixes: ["metadata"] },
    ]);
  });
});
