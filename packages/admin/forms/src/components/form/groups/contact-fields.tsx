"use client";

import * as React from "react";
import { withFieldGroup } from "../hooks";
import { FieldSet, FieldLegend } from "@eng-mohamedelsayed/admin-ui/components/ui/field";

export interface ContactFieldsValue {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | undefined;
  company?: string | undefined;
  job_title?: string | undefined;
}

export const ContactFields = withFieldGroup<ContactFieldsValue, unknown>({
  render: ({ group }) => (
    <FieldSet className="space-y-4 rounded-lg border p-4 bg-card shadow-2xs">
      <FieldLegend>Contact Information</FieldLegend>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <group.AppField name="first_name">
          {(field) => <field.Input label="First Name" required />}
        </group.AppField>

        <group.AppField name="last_name">
          {(field) => <field.Input label="Last Name" required />}
        </group.AppField>

        <group.AppField name="email">
          {(field) => <field.Input label="Email Address" type="email" dir="ltr" required />}
        </group.AppField>

        <group.AppField name="phone">
          {(field) => <field.Input label="Phone Number" type="tel" dir="ltr" />}
        </group.AppField>

        <group.AppField name="company">
          {(field) => <field.Input label="Company Name" />}
        </group.AppField>

        <group.AppField name="job_title">
          {(field) => <field.Input label="Job Title" />}
        </group.AppField>
      </div>
    </FieldSet>
  ),
});
