"use client";

import * as React from "react";
import type { ViewRendererProps } from "../../data-view/registry";
import { CalendarView } from "../calendar/calendar-view";
import type { CalendarViewConfig, CalendarViewState } from "../calendar/calendar-types";

/**
 * DataView Engine adapter for Calendar.
 * Renders the reusable CalendarView component within the active Resource context.
 *
 * Invariants:
 * - Authoritative rows: consumes dataView.data directly without local filtering.
 * - Minimal URL state: dispatches only mode and date via dataView.patchViewState.
 * - Strict identity: supplies resource.dataView.getRowId to the event mapper.
 */
export function ResourceCalendarView({
  resource,
  view,
  dataView,
  config: rawConfig,
  state: rawState,
}: ViewRendererProps) {
  const config = (rawConfig ?? {}) as unknown as CalendarViewConfig;
  const state = (rawState ?? {}) as unknown as CalendarViewState;

  const handleStateChange = React.useCallback(
    (patch: Partial<CalendarViewState>) => {
      dataView.patchViewState(view.id, patch as Record<string, import("@eng-mohamedelsayed/admin-core").JsonValue | undefined>);
    },
    [dataView, view.id]
  );

  const getRowId = React.useCallback(
    (row: unknown) => {
      if (resource.dataView.getRowId) {
        return resource.dataView.getRowId(row);
      }
      return (row as { id?: string })?.id ?? "";
    },
    [resource.dataView]
  );

  return (
    <CalendarView
      data={dataView.data}
      getRowId={getRowId}
      config={config}
      state={state}
      onStateChange={handleStateChange}
      onEventClick={dataView.onRowClick}
      loading={dataView.loading}
      errorState={dataView.errorState}
      onRetry={dataView.onRetry}
      emptyTitle={dataView.emptyTitle}
      emptyDescription={dataView.emptyDescription}
    />
  );
}
