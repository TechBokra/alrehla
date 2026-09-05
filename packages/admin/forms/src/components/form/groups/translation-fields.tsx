"use client";

import { withFieldGroup } from "../hooks";
import { FieldLegend, FieldSet } from "@eng-mohamedelsayed/admin-ui/components/ui/field";

export interface TranslationFieldsValue {
  name: Record<string, string>;
  description: Record<string, string>;
}

export const TranslationFields = withFieldGroup<TranslationFieldsValue, unknown>({
  render: ({ group }) => (
    <FieldSet className="space-y-4 rounded-lg border bg-card p-4 shadow-2xs">
      <FieldLegend>Translations</FieldLegend>
      <div className="space-y-4">
        <group.AppField name="name">
          {(field) => <field.Translation label="Localized name" />}
        </group.AppField>
        <group.AppField name="description">
          {(field) => (
            <field.Translation label="Localized description" type="textarea" />
          )}
        </group.AppField>
      </div>
    </FieldSet>
  ),
});
