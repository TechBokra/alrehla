"use client";

import * as React from "react";
import {
  HierarchyDataTableField,
  type HierarchyNodeItem,
} from "../../fields/hierarchy/hierarchy-data-table-field";
import type { ParentEntity } from "../../fields/pickers/parent-picker";
import { FieldLegend, FieldSet } from "@eng-mohamedelsayed/admin-ui/components/ui/field";
import { withFieldGroup } from "../hooks";

export interface HierarchyFieldsValue {
  parent_id?: string | null | undefined;
  parent_category_id?: string | null | undefined;
  sort_order?: number | undefined;
  rank?: number | undefined;
  order?: number | undefined;
  name?: string | undefined;
}

export interface HierarchyFieldsOptions {
  mode?: "data-table" | "select";
  legend?: string | undefined;
  parentFieldName?: "parent_id" | "parent_category_id";
  orderFieldName?: "sort_order" | "rank" | "order";
  parentLabel?: string | undefined;
  parentDescription?: string | undefined;
  orderLabel?: string | undefined;
  orderDescription?: string | undefined;
  parentItems?: ParentEntity[] | HierarchyNodeItem[];
  onParentSearch?: ((query: string) => Promise<ParentEntity[]>) | undefined;
  currentId?: string | null | undefined;
  currentName?: string | undefined;
  excludeIds?: string[] | undefined;
  disabled?: boolean | undefined;
  allowRoot?: boolean | undefined;
  className?: string | undefined;
}

export const HierarchyFields = withFieldGroup<
  HierarchyFieldsValue,
  unknown,
  HierarchyFieldsOptions
>({
  render: ({
    group,
    mode = "data-table",
    legend = "Hierarchy & Placement",
    parentFieldName = "parent_id",
    orderFieldName = "sort_order",
    parentLabel = "Parent Resource",
    parentDescription = "Select a parent to nest this resource under, or leave empty for root.",
    orderLabel = "Sort Order",
    orderDescription = "Lower numbers appear first within the same level.",
    parentItems = [],
    onParentSearch,
    currentId,
    currentName,
    excludeIds = [],
    disabled = false,
    allowRoot = true,
    className,
  }) => {
    if (mode === "data-table") {
      return (
        <FieldSet
          className={`space-y-3 rounded-lg border bg-card p-4 shadow-2xs ${className || ""}`}
        >
          <FieldLegend>{legend}</FieldLegend>

          <group.AppField name={parentFieldName as any}>
            {(parentField: any) => (
              <group.AppField name={orderFieldName as any}>
                {(orderField: any) => (
                  <HierarchyDataTableField
                    currentId={currentId}
                    currentName={currentName || "This Resource"}
                    parentCategoryId={parentField.state.value}
                    sortOrder={orderField.state.value ?? 0}
                    items={parentItems as HierarchyNodeItem[]}
                    onHierarchyChange={(parentId, order) => {
                      parentField.handleChange(parentId);
                      orderField.handleChange(order);
                    }}
                    disabled={disabled}
                  />
                )}
              </group.AppField>
            )}
          </group.AppField>
        </FieldSet>
      );
    }

    return (
      <FieldSet
        className={`space-y-4 rounded-lg border bg-card p-4 shadow-2xs ${className || ""}`}
      >
        <FieldLegend>{legend}</FieldLegend>

        <div className="grid gap-4 sm:grid-cols-2">
          <group.AppField name={parentFieldName as any}>
            {(field: any) => (
              <field.ParentPicker
                label={parentLabel}
                description={parentDescription}
                placeholder="Select parent (or root)..."
                items={parentItems as ParentEntity[]}
                onSearch={onParentSearch}
                currentId={currentId}
                excludeIds={excludeIds}
                disabled={disabled}
                allowRoot={allowRoot}
              />
            )}
          </group.AppField>

          <group.AppField name={orderFieldName as any}>
            {(field: any) => (
              <field.Order
                label={orderLabel}
                description={orderDescription}
                min={0}
                step={1}
                placeholder="0"
                disabled={disabled}
              />
            )}
          </group.AppField>
        </div>
      </FieldSet>
    );
  },
});
