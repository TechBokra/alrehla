import * as React from "react";
import { render, screen, waitFor, type RenderResult } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect } from "vitest";
import { useAppForm } from "../src/components/form/hooks";

export type TestFormValues = Record<string, unknown>;

export function readFormState<T extends TestFormValues>(
  testId = "form-values"
): T {
  return JSON.parse(screen.getByTestId(testId).textContent || "null") as T;
}

export function createProduct(overrides: TestFormValues = {}) {
  return {
    id: "product-1",
    title: "Classic Shirt",
    sku: "CLS-001",
    price: 799,
    stock: 12,
    ...overrides,
  };
}

export function createAddress(overrides: TestFormValues = {}) {
  return {
    first_name: "Amira",
    last_name: "Hassan",
    company: "",
    address_1: "10 Nile Street",
    address_2: "",
    city: "Giza",
    province: "Giza",
    postal_code: "12577",
    country_code: "EG",
    phone: "+20 100 000 0000",
    ...overrides,
  };
}

export function createImageAsset(overrides: TestFormValues = {}) {
  return {
    id: "asset-1",
    url: "https://cdn.example.test/shirt.jpg",
    fileName: "shirt.jpg",
    mimeType: "image/jpeg",
    size: 1024,
    ...overrides,
  };
}

export function createVariant(overrides: TestFormValues = {}) {
  return {
    tempId: "variant-temp-1",
    attributes: [
      {
        attributeId: "color",
        attributeName: "Color",
        valueId: "black",
        valueLabel: "Black",
      },
    ],
    sku: "CLS-BLK",
    price: 799,
    stockQuantity: 4,
    enabled: true,
    isDefault: true,
    ...overrides,
  };
}

export function createRule(overrides: TestFormValues = {}) {
  return {
    match: "all",
    conditions: [
      { id: "condition-1", field: "brand", operator: "equals", value: "nike" },
    ],
    ...overrides,
  };
}

interface FormHarnessProps<T extends TestFormValues> {
  defaultValues: T;
  validators?: unknown;
  onSubmit?: (value: T) => void | Promise<void>;
  children: (form: any) => React.ReactNode;
}

export function FormHarness<T extends TestFormValues>({
  defaultValues,
  validators,
  onSubmit,
  children,
}: FormHarnessProps<T>) {
  const form = useAppForm({
    defaultValues,
    validators: validators as any,
    onSubmit: async ({ value }: { value: T }) => onSubmit?.(value),
  } as any);

  return (
    <form.AppForm>
      <form
        aria-label="test form"
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit().catch(() => undefined);
        }}
      >
        <form.Subscribe selector={(state: any) => state.values}>
          {(values: T) => (
            <output data-testid="form-values">{JSON.stringify(values)}</output>
          )}
        </form.Subscribe>
        <form.Subscribe
          selector={(state: any) => ({
            canSubmit: state.canSubmit,
            isDirty: state.isDirty,
            isSubmitting: state.isSubmitting,
          })}
        >
          {(state: { canSubmit: boolean; isDirty: boolean; isSubmitting: boolean }) => (
            <output data-testid="form-meta">{JSON.stringify(state)}</output>
          )}
        </form.Subscribe>
        {children(form)}
      </form>
    </form.AppForm>
  );
}

export function renderForm<T extends TestFormValues>(
  props: FormHarnessProps<T>
): { user: ReturnType<typeof userEvent.setup> } & RenderResult {
  return {
    user: userEvent.setup(),
    ...render(<FormHarness {...props} />),
  };
}

export async function waitForState<T extends TestFormValues>(
  expected: Partial<T>
) {
  await waitFor(() =>
    expect(readFormState<T>()).toEqual(expect.objectContaining(expected as any))
  );
}
