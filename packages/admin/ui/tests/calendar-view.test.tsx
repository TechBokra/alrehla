import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { format } from "date-fns";
import { CalendarView } from "../src/components/calendar/calendar-view";
import type { CalendarViewConfig, CalendarVisibleRange, CalendarViewState } from "../src/components/calendar/calendar-types";

describe("CalendarView Component", () => {
  const sampleConfig: CalendarViewConfig = {
    eventMapping: {
      titleKey: "title",
      startKey: "start",
      endKey: "end",
      allDayKey: "allDay",
    },
    defaultMode: "dayGridMonth",
    initialDate: "2026-09-01",
  };

  const sampleData = [
    {
      id: "event-1",
      title: "Spring Promo Drop",
      start: "2026-09-05T10:00:00Z",
      end: "2026-09-05T12:00:00Z",
      allDay: false,
    },
    {
      id: "event-2",
      title: "All Day Holiday",
      start: "2026-09-15",
      allDay: true,
    },
  ];

  const getRowId = (row: unknown) => (row as { id: string }).id;

  it("renders calendar toolbar with initial period title and mode buttons", () => {
    render(
      <CalendarView
        data={sampleData}
        getRowId={getRowId}
        config={sampleConfig}
      />
    );

    expect(screen.getByRole("button", { name: /previous period/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /next period/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /today/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /month/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /week/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /day/i })).toBeTruthy();
  });

  it("treats datesSet strictly as an observation callback and never calls onStateChange on mount", () => {
    const onStateChange = vi.fn();
    const onVisibleRangeChange = vi.fn();

    render(
      <CalendarView
        data={sampleData}
        getRowId={getRowId}
        config={sampleConfig}
        onStateChange={onStateChange}
        onVisibleRangeChange={onVisibleRangeChange}
      />
    );

    // datesSet fires observation callback on mount
    expect(onVisibleRangeChange).toHaveBeenCalled();
    const emittedRange: CalendarVisibleRange = onVisibleRangeChange.mock.calls[0]![0]!;
    expect(emittedRange.start).toBeInstanceOf(Date);
    expect(emittedRange.end).toBeInstanceOf(Date);

    // Invariant: datesSet MUST NOT write to URL state (no feedback loop)
    expect(onStateChange).not.toHaveBeenCalled();
  });

  it("persists focused date in local yyyy-MM-dd format via date-fns on user Next and Prev clicks", () => {
    const onStateChange = vi.fn();

    render(
      <CalendarView
        data={sampleData}
        getRowId={getRowId}
        config={sampleConfig}
        onStateChange={onStateChange}
      />
    );

    const nextBtn = screen.getByRole("button", { name: /next period/i });
    fireEvent.click(nextBtn);

    expect(onStateChange).toHaveBeenCalledTimes(1);
    const nextCall = onStateChange.mock.calls[0]![0]!;
    expect(nextCall.date).toBeDefined();
    // Verify yyyy-MM-dd format matching date-fns
    expect(nextCall.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    // Explicit invariant: range is NOT in state patch
    expect((nextCall as Record<string, unknown>).range).toBeUndefined();

    const prevBtn = screen.getByRole("button", { name: /previous period/i });
    fireEvent.click(prevBtn);

    expect(onStateChange).toHaveBeenCalledTimes(2);
    const prevCall = onStateChange.mock.calls[1]![0]!;
    expect(prevCall.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("persists today local date via date-fns format when Today button is clicked", () => {
    const onStateChange = vi.fn();
    const expectedToday = format(new Date(), "yyyy-MM-dd");

    render(
      <CalendarView
        data={sampleData}
        getRowId={getRowId}
        config={sampleConfig}
        onStateChange={onStateChange}
      />
    );

    const todayBtn = screen.getByRole("button", { name: /today/i });
    fireEvent.click(todayBtn);

    expect(onStateChange).toHaveBeenCalledWith({ date: expectedToday });
  });

  it("persists mode change when user switches tabs to Week or Day", () => {
    const onStateChange = vi.fn();

    render(
      <CalendarView
        data={sampleData}
        getRowId={getRowId}
        config={sampleConfig}
        onStateChange={onStateChange}
      />
    );

    const weekTab = screen.getByRole("tab", { name: /week/i });
    fireEvent.click(weekTab);
    expect(onStateChange).toHaveBeenCalledWith({ mode: "timeGridWeek" });

    const dayTab = screen.getByRole("tab", { name: /day/i });
    fireEvent.click(dayTab);
    expect(onStateChange).toHaveBeenCalledWith({ mode: "timeGridDay" });
  });

  it("renders standard empty state when data array is empty (data.length === 0)", () => {
    render(
      <CalendarView
        data={[]}
        getRowId={getRowId}
        config={sampleConfig}
        emptyTitle="No records found"
      />
    );

    expect(screen.getByText("No records found")).toBeTruthy();
  });

  it("renders distinct explanatory feedback when records exist but none are schedulable", () => {
    const unmappableData = [
      { id: "1", title: "Record 1", start: "" },
      { id: "2", title: "Record 2", start: "invalid-date" },
    ];

    render(
      <CalendarView
        data={unmappableData}
        getRowId={getRowId}
        config={sampleConfig}
      />
    );

    expect(screen.getByText("No schedulable calendar events")).toBeTruthy();
    expect(
      screen.getByText(/Loaded 2 records, but none contain valid calendar dates/i)
    ).toBeTruthy();
  });

  it("renders error state when errorState prop is provided and triggers onRetry", () => {
    const onRetry = vi.fn();

    render(
      <CalendarView
        data={sampleData}
        getRowId={getRowId}
        config={sampleConfig}
        errorState={{
          context: "query",
          error: { message: "Network failure while fetching", type: "NETWORK_ERROR" } as any,
          severity: "error",
          blocking: true,
          retryable: true,
          title: "Network failure while fetching",
          description: "Please check your internet connection.",
        }}
        onRetry={onRetry}
      />
    );

    expect(screen.getByText("Network failure while fetching")).toBeTruthy();
    const retryBtn = screen.getByRole("button", { name: /try again/i });
    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders loading status overlay without removing calendar structure", () => {
    render(
      <CalendarView
        data={sampleData}
        getRowId={getRowId}
        config={sampleConfig}
        loading={true}
      />
    );

    expect(screen.getByRole("status", { name: /loading calendar data/i })).toBeTruthy();
    expect(screen.getByText("Updating calendar...")).toBeTruthy();
  });
});
