export type CalendarMode = "dayGridMonth" | "timeGridWeek" | "timeGridDay";

export interface CalendarViewState {
  mode?: CalendarMode;
  date?: string; // Formatted as local yyyy-MM-dd via date-fns
}

export interface CalendarVisibleRange {
  start: Date;
  end: Date; // Exclusive end date as per FullCalendar semantics
  startStr: string;
  endStr: string;
}

export interface CalendarEventMappingConfig {
  titleKey: string;
  startKey: string;
  endKey?: string;
  allDayKey?: string;
  allDayDefault?: boolean;
  descriptionKey?: string;
  colorKey?: string;
}

export interface CalendarViewConfig {
  eventMapping: CalendarEventMappingConfig;
  defaultMode?: CalendarMode;
  initialDate?: string;
  weekends?: boolean;
  slotMinTime?: string;
  slotMaxTime?: string;
}

export interface TransformedCalendarEvent<TData = unknown> {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay: boolean;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  extendedProps: {
    record: TData;
    description?: string;
  };
}

export interface EventMappingResult<TData = unknown> {
  events: TransformedCalendarEvent<TData>[];
  totalRecords: number;
  mappedCount: number;
  unmappableCount: number;
}
