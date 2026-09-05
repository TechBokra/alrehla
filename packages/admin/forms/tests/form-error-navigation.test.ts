import { describe, expect, it } from "vitest";
import {
  focusFormField,
  getFormFieldFocusTarget,
  normalizeFormErrors,
  resolveFormErrorsBySection,
  type FormErrorEntry,
} from "../src/components/forms";

describe("form error navigation core", () => {
  it("normalizes client validation, nested issues, form errors, and duplicates", () => {
    const errors = normalizeFormErrors({
      fieldMeta: {
        title: { errors: ["Title is required", "Title is required"] },
        "variants[3].sku": {
          errors: [{ path: ["variants", 3, "sku"], message: "SKU exists" }],
        },
      },
      errorMap: {
        onSubmit: {
          form: "Review the product before saving.",
          fields: { title: "Title is required" },
        },
      },
    });

    expect(errors).toEqual([
      {
        message: "Review the product before saving.",
        source: "form",
      },
      {
        fieldPath: "title",
        message: "Title is required",
        source: "validation",
      },
      {
        fieldPath: "variants[3].sku",
        message: "SKU exists",
        source: "validation",
      },
    ]);
  });

  it("normalizes server onServer errors and preserves server precedence", () => {
    const errors = normalizeFormErrors({
      errorMap: {
        onServer: {
          form: "Product could not be saved",
          fields: {
            "variants[3].sku": "SKU already exists",
            media: "Upload failed",
          },
        },
      },
      fieldMeta: {
        "variants[3].sku": { errors: ["SKU already exists"] },
      },
    });

    expect(errors).toEqual([
      { message: "Product could not be saved", source: "form" },
      {
        fieldPath: "variants[3].sku",
        message: "SKU already exists",
        source: "server",
      },
      { fieldPath: "media", message: "Upload failed", source: "server" },
    ]);
  });

  it("assigns nested fields to the first matching section in declared order", () => {
    const errors: FormErrorEntry[] = [
      {
        fieldPath: "variants[3].sku",
        message: "Duplicate SKU",
        source: "validation",
      },
      {
        fieldPath: "categoryIds",
        message: "Choose a category",
        source: "validation",
      },
      { fieldPath: "media", message: "Upload failed", source: "server" },
      { message: "Product could not be saved", source: "form" },
    ];
    const result = resolveFormErrorsBySection(errors, [
      { id: "general", fields: ["title"] },
      { id: "organization", fields: ["categoryIds"] },
      { id: "variants", fields: ["variants"] },
      { id: "media", fields: ["media"] },
    ]);

    expect(result.firstInvalidSectionId).toBe("organization");
    expect(result.errorCountBySection).toEqual({
      general: 0,
      organization: 1,
      variants: 1,
      media: 1,
    });
    expect(result.errorsBySection.variants).toHaveLength(1);
    expect(result.unassignedErrors).toEqual([
      { message: "Product could not be saved", source: "form" },
    ]);
  });

  it("focuses stable field names and safely falls back for custom editors", () => {
    document.body.innerHTML =
      '<input id="variants[3].sku" name="variants[3].sku" />';
    const input = document.querySelector("input") as HTMLInputElement;
    expect(getFormFieldFocusTarget("variants[3].sku")).toEqual({
      fieldPath: "variants[3].sku",
      id: "variants[3].sku",
      name: "variants[3].sku",
    });
    expect(focusFormField("variants[3].sku")).toBe(true);
    expect(document.activeElement).toBe(input);
    expect(focusFormField("variants[4].sku")).toBe(false);
  });
});
