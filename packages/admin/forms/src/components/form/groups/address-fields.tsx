"use client";

import * as React from "react";
import { withFieldGroup } from "../hooks";
import { FieldSet, FieldLegend } from "@eng-mohamedelsayed/admin-ui/components/ui/field";

export interface AddressFieldsValue {
  first_name: string;
  last_name: string;
  company?: string | undefined;
  address_1: string;
  address_2?: string | undefined;
  city: string;
  province?: string | undefined;
  postal_code?: string | undefined;
  country_code: string;
  phone?: string | undefined;
}

export const AddressFields = withFieldGroup<AddressFieldsValue, unknown>({
  render: ({ group }) => (
    <FieldSet className="space-y-4 rounded-lg border p-4 bg-card shadow-2xs">
      <FieldLegend>Address Details</FieldLegend>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <group.AppField name="first_name">
          {(field) => <field.Input label="First Name" required />}
        </group.AppField>

        <group.AppField name="last_name">
          {(field) => <field.Input label="Last Name" required />}
        </group.AppField>

        <group.AppField name="company">
          {(field) => <field.Input label="Company (Optional)" />}
        </group.AppField>

        <group.AppField name="phone">
          {(field) => <field.Input label="Phone Number" type="tel" dir="ltr" />}
        </group.AppField>

        <div className="sm:col-span-2">
          <group.AppField name="address_1">
            {(field) => <field.Input label="Street Address" placeholder="123 Commerce St" required />}
          </group.AppField>
        </div>

        <div className="sm:col-span-2">
          <group.AppField name="address_2">
            {(field) => <field.Input label="Apartment, suite, etc. (Optional)" />}
          </group.AppField>
        </div>

        <group.AppField name="city">
          {(field) => <field.Input label="City" required />}
        </group.AppField>

        <group.AppField name="province">
          {(field) => <field.Input label="State / Governorate" />}
        </group.AppField>

        <group.AppField name="postal_code">
          {(field) => <field.Input label="Postal Code" dir="ltr" />}
        </group.AppField>

        <group.AppField name="country_code">
          {(field) => (
            <field.Select
              label="Country"
              required
              options={[
                { value: "EG", label: "Egypt" },
                { value: "SA", label: "Saudi Arabia" },
                { value: "AE", label: "United Arab Emirates" },
                { value: "US", label: "United States" },
              ]}
            />
          )}
        </group.AppField>
      </div>
    </FieldSet>
  ),
});
