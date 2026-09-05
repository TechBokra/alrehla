"use client";

import * as React from "react";
import { SearchX } from "lucide-react";
import { EmptyState } from "../feedback/empty-state";
import { Button } from "../ui/button";
import { useResource } from "@eng-mohamedelsayed/admin-core/resource";
import { ResourceCreate } from "./resource-create";

function hasActiveFilters(filters: Record<string, unknown>) {
  return Object.values(filters).some((value) => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== null && value !== "";
  });
}

export interface ResourceEmptyStateProps {
  className?: string;
}

/**
 * The shared empty-state policy for Resource DataViews. It deliberately reads
 * the same Resource create command as ResourceCreate, so the empty-state CTA
 * cannot drift into a second form-opening path.
 */
export function ResourceEmptyState({ className }: ResourceEmptyStateProps = {}) {
  const { definition, capabilities, dataView } = useResource();
  const metadata = definition.metadata;
  const emptyState = definition.emptyState;
  const hasQuery =
    dataView.state.search.trim().length > 0 ||
    hasActiveFilters(dataView.state.filters);
  const pluralLabel = metadata.pluralLabel ?? metadata.label;
  const singularLabel = metadata.singularLabel;
  const pluralName = pluralLabel.toLowerCase();
  const singularName = singularLabel.toLowerCase();
  const Icon = hasQuery ? SearchX : emptyState?.icon ?? metadata.icon;

  const clearQuery = () => {
    dataView.onFiltersReset?.();
    dataView.onSearchInputChange?.("");
    dataView.onSearchChange?.("");
  };

  const title = hasQuery
    ? "No results found"
    : emptyState?.title ?? `No ${pluralName} yet`;
  const description = hasQuery
    ? `No ${pluralName} match the current search or filters.`
    : emptyState?.description ??
      (capabilities.create
        ? `Create your first ${singularName} to get started.`
        : `There are currently no ${pluralName} to display.`);

  const action = hasQuery ? (
    <Button type="button" variant="outline" size="sm" onClick={clearQuery}>
      Clear filters
    </Button>
  ) : capabilities.create ? (
    <ResourceCreate
      size="sm"
      label={emptyState?.createLabel ?? `Create ${singularLabel}`}
    />
  ) : null;

  return (
    <EmptyState
      className={className}
      {...(Icon ? { icon: Icon as React.ComponentType<{ className?: string }> } : {})}
      title={title}
      description={description}
      action={action}
    />
  );
}
