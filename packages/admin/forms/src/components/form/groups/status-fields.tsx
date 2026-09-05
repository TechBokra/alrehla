"use client";

import { withFieldGroup } from "../hooks";
import { FieldLegend, FieldSet } from "@eng-mohamedelsayed/admin-ui/components/ui/field";

export interface StatusFieldsValue {
  is_active: boolean;
  is_internal: boolean;
}

export const StatusFields = withFieldGroup<StatusFieldsValue, unknown>({
  render: ({ group }) => (
    <FieldSet className="space-y-4 rounded-lg border bg-card p-4 shadow-2xs">
      <FieldLegend>Visibility</FieldLegend>
      <div className="grid gap-3 sm:grid-cols-2">
        <group.AppField name="is_active">
          {(field) => (
            <field.Switch
              label="Active"
              description="Make this category available in the storefront"
            />
          )}
        </group.AppField>
        <group.AppField name="is_internal">
          {(field) => (
            <field.Switch
              label="Internal"
              description="Keep this category for internal organization"
            />
          )}
        </group.AppField>
      </div>
    </FieldSet>
  ),
});
