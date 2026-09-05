"use client";

import * as React from "react";
import FullCalendar, { type CalendarRef } from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import timeGridPlugin from "@fullcalendar/react/timegrid";
import { format, isValid, parseISO } from "date-fns";
import { cn } from "../../lib/utils";
import { CalendarToolbar } from "./calendar-toolbar";
import { mapRecordsToCalendarEvents } from "./calendar-event-mapping";
import type {
  CalendarMode,
  CalendarViewConfig,
  CalendarVisibleRange,
  CalendarViewState,
} from "./calendar-types";
import { EmptyState } from "../feedback/empty-state";
import { ErrorState } from "../feedback/error-state";
import { Skeleton } from "../ui/skeleton";
import type { ResourceErrorState } from "@eng-mohamedelsayed/admin-core/resource";
import { Calendar as CalendarIcon, CalendarX2 } from "lucide-react";
import "./calendar.css";

export interface CalendarViewProps<TData = unknown> {
  data: readonly TData[];
  getRowId: (row: TData) => string;
  config: CalendarViewConfig;
  state?: CalendarViewState | undefined;
  onStateChange?: ((patch: Partial<CalendarViewState>) => void) | undefined;
  onVisibleRangeChange?: ((range: CalendarVisibleRange) => void) | undefined;
  onEventClick?: ((record: TData) => void) | undefined;
  loading?: boolean | undefined;
  errorState?: ResourceErrorState | null | undefined;
  onRetry?: (() => void) | undefined;
  emptyTitle?: string | undefined;
  emptyDescription?: string | undefined;
  className?: string | undefined;
}

export function CalendarView<TData = unknown>({
  data,
  getRowId,
  config,
  state,
  onStateChange,
  onVisibleRangeChange,
  onEventClick,
  loading = false,
  errorState = null,
  onRetry,
  emptyTitle = "No records found",
  emptyDescription = "There are no records to display in the calendar for the active filter.",
  className,
}: CalendarViewProps<TData>) {
  const calendarRef = React.useRef<CalendarRef | null>(null);
  const [title, setTitle] = React.useState<string>("");

  // Determine effective mode and initial focused date
  const effectiveMode: CalendarMode =
    state?.mode ?? config.defaultMode ?? "dayGridMonth";

  // Validate initial date; fallback to today's local date
  const initialDateStr = React.useMemo(() => {
    if (state?.date) {
      const parsed = parseISO(state.date);
      if (isValid(parsed)) return state.date;
    }
    if (config.initialDate) {
      const parsed = parseISO(config.initialDate);
      if (isValid(parsed)) return config.initialDate;
    }
    return format(new Date(), "yyyy-MM-dd");
  }, [state?.date, config.initialDate]);

  // Synchronize FullCalendar instance view if state.mode changes externally
  React.useEffect(() => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi && calendarApi.view.type !== effectiveMode) {
      calendarApi.changeView(effectiveMode);
    }
  }, [effectiveMode]);

  // Synchronize FullCalendar instance date if state.date changes externally
  React.useEffect(() => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi && state?.date) {
      const currentCalDate = format(calendarApi.getDate(), "yyyy-MM-dd");
      if (currentCalDate !== state.date) {
        calendarApi.gotoDate(state.date);
      }
    }
  }, [state?.date]);

  // Transform records to FullCalendar events using strict mapping and identity
  const { events, totalRecords, mappedCount } = React.useMemo(() => {
    return mapRecordsToCalendarEvents(data, getRowId, config.eventMapping);
  }, [data, getRowId, config.eventMapping]);

  // Guard against duplicate execution between keyboard and mouse events
  const lastActionTimestampRef = React.useRef<number>(0);
  const handleEventAction = React.useCallback(
    (record: TData) => {
      const now = Date.now();
      if (now - lastActionTimestampRef.current < 200) {
        return; // Prevent duplicate execution within debounce window
      }
      lastActionTimestampRef.current = now;
      onEventClick?.(record);
    },
    [onEventClick]
  );

  // Explicit user navigation actions (the ONLY source of URL date writes)
  const handlePrev = React.useCallback(() => {
    const api = calendarRef.current?.getApi();
    if (!api) return;
    api.prev();
    const nextDate = format(api.getDate(), "yyyy-MM-dd");
    onStateChange?.({ date: nextDate });
  }, [onStateChange]);

  const handleNext = React.useCallback(() => {
    const api = calendarRef.current?.getApi();
    if (!api) return;
    api.next();
    const nextDate = format(api.getDate(), "yyyy-MM-dd");
    onStateChange?.({ date: nextDate });
  }, [onStateChange]);

  const handleToday = React.useCallback(() => {
    const api = calendarRef.current?.getApi();
    if (!api) return;
    api.today();
    const todayStr = format(new Date(), "yyyy-MM-dd");
    onStateChange?.({ date: todayStr });
  }, [onStateChange]);

  const handleModeChange = React.useCallback(
    (nextMode: CalendarMode) => {
      const api = calendarRef.current?.getApi();
      if (!api) return;
      api.changeView(nextMode);
      onStateChange?.({ mode: nextMode });
    },
    [onStateChange]
  );

  // Observation-only datesSet callback: updates title and informs runtime range listener.
  // NEVER calls onStateChange or mutates URL state.
  const handleDatesSet = React.useCallback(
    (info: {
      view: { title: string; type: string };
      start: Date;
      end: Date;
      startStr: string;
      endStr: string;
    }) => {
      setTitle(info.view.title);
      onVisibleRangeChange?.({
        start: info.start,
        end: info.end,
        startStr: info.startStr,
        endStr: info.endStr,
      });
    },
    [onVisibleRangeChange]
  );

  // Mount keyboard accessibility listeners on event elements
  const handleEventDidMount = React.useCallback(
    (info: {
      el: HTMLElement;
      event: { title: string; extendedProps: Record<string, any> };
    }) => {
      const el = info.el;
      el.setAttribute("tabindex", "0");
      el.setAttribute("role", "button");
      el.setAttribute(
        "aria-label",
        `Calendar event: ${info.event.title || "Untitled"}`
      );

      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault(); // Prevent page scroll on Space
          const record = info.event.extendedProps?.record as TData;
          if (record) {
            handleEventAction(record);
          }
        }
      };

      el.addEventListener("keydown", onKeyDown);
    },
    [handleEventAction]
  );

  // 1. Error state handling
  if (errorState) {
    return (
      <div className={cn("p-6", className)}>
        <ErrorState
          title={errorState.title || "Failed to load calendar events"}
          description={
            errorState.description ||
            "An error occurred while loading resource data for this calendar view."
          }
          {...(onRetry ? { onRetry } : {})}
        />
      </div>
    );
  }

  // 2. Distinguish: Empty query records vs unmappable records
  const hasNoQueryRecords = totalRecords === 0 && !loading;
  const hasUnmappableRecordsOnly =
    totalRecords > 0 && mappedCount === 0 && !loading;

  return (
    <div
      className={cn(
        "admin-calendar-root relative flex flex-col w-full rounded-md border border-border bg-card p-4 shadow-xs",
        className
      )}
    >
      {/* Top Toolbar */}
      <CalendarToolbar
        title={title}
        mode={effectiveMode}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
        onModeChange={handleModeChange}
      />

      {/* Loading Overlay */}
      {loading && (
        <div
          role="status"
          aria-label="Loading calendar data"
          className="absolute inset-0 z-20 flex items-center justify-center rounded-md bg-background/60 backdrop-blur-xs transition-opacity"
        >
          <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-card border border-border shadow-md">
            <Skeleton className="h-6 w-32" />
            <span className="text-xs text-muted-foreground font-medium">
              Updating calendar...
            </span>
          </div>
        </div>
      )}

      {/* Case A: Query returned zero records */}
      {hasNoQueryRecords && (
        <div className="py-12">
          <EmptyState
            icon={CalendarIcon}
            title={emptyTitle}
            description={emptyDescription}
          />
        </div>
      )}

      {/* Case B: Query returned records, but none contain valid calendar dates */}
      {hasUnmappableRecordsOnly && (
        <div className="py-12">
          <EmptyState
            icon={CalendarX2}
            title="No schedulable calendar events"
            description={`Loaded ${totalRecords} record${
              totalRecords === 1 ? "" : "s"
            }, but none contain valid calendar dates for the configured mapping.`}
          />
        </div>
      )}

      {/* Active Calendar Grid (rendered when records exist or while loading) */}
      {!hasNoQueryRecords && !hasUnmappableRecordsOnly && (
        <div className="mt-2 min-h-[500px]">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin]}
            initialView={effectiveMode}
            initialDate={initialDateStr}
            headerToolbar={false}
            events={events}
            datesSet={handleDatesSet}
            eventClick={(info) => {
              const record = info.event.extendedProps?.record as TData;
              if (record) {
                handleEventAction(record);
              }
            }}
            eventDidMount={handleEventDidMount}
            height="auto"
            weekends={config.weekends ?? true}
            slotMinTime={config.slotMinTime ?? "00:00:00"}
            slotMaxTime={config.slotMaxTime ?? "24:00:00"}
            nowIndicator
          />
        </div>
      )}
    </div>
  );
}
