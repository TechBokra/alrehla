"use client";

import * as React from "react";
import { withFieldGroup } from "../hooks";
import { FieldSet, FieldLegend } from "@eng-mohamedelsayed/admin-ui/components/ui/field";

export interface ScheduleFieldsValue {
  starts_at?: Date | string | undefined;
  ends_at?: Date | string | undefined;
  timezone?: string | undefined;
}

export const ScheduleFields = withFieldGroup<ScheduleFieldsValue, unknown>({
  render: ({ group }) => (
    <FieldSet className="space-y-4 rounded-lg border p-4 bg-card shadow-2xs">
      <FieldLegend>Campaign Schedule</FieldLegend>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <group.AppField name="starts_at">
          {(field) => <field.DateTime label="Starts At" />}
        </group.AppField>

        <group.AppField name="ends_at">
          {(field) => <field.DateTime label="Ends At" />}
        </group.AppField>

        <div className="sm:col-span-2">
          <group.AppField name="timezone">
            {(field) => (
              <field.Select
                label="Timezone"
                options={[
                  { value: "UTC", label: "UTC" },
                  { value: "Africa/Cairo", label: "Africa/Cairo (EET)" },
                  { value: "Asia/Riyadh", label: "Asia/Riyadh (AST)" },
                  { value: "Asia/Dubai", label: "Asia/Dubai (GST)" },
                ]}
              />
            )}
          </group.AppField>
        </div>
      </div>
    </FieldSet>
  ),
});
