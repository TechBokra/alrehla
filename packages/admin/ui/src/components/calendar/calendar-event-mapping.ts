import { isBefore, isValid, parseISO } from "date-fns";
import type {
  CalendarEventMappingConfig,
  EventMappingResult,
  TransformedCalendarEvent,
} from "./calendar-types";

/**
 * Strict boolean parser that avoids truthiness coercion (e.g. "false" or "0" becoming true).
 */
export function parseStrictBoolean(value: unknown, fallback: boolean = false): boolean {
  if (value === true || value === "true" || value === 1 || value === "1") {
    return true;
  }
  if (value === false || value === "false" || value === 0 || value === "0") {
    return false;
  }
  return fallback;
}

/**
 * Parses a date value into a valid Date object or returns null if invalid.
 */
function parseValidDate(value: unknown): Date | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (value instanceof Date) {
    return isValid(value) ? value : null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const isoDate = parseISO(trimmed);
    if (isValid(isoDate)) return isoDate;
    const fallbackDate = new Date(trimmed);
    return isValid(fallbackDate) ? fallbackDate : null;
  }

  if (typeof value === "number") {
    const numDate = new Date(value);
    return isValid(numDate) ? numDate : null;
  }

  return null;
}

/**
 * Maps resource records to FullCalendar event inputs strictly according to the declarative configuration.
 *
 * Invariants:
 * - ID is derived strictly from `getRowId(record)`. No fallback to record.id or array index.
 * - No implicit field guessing or fallback probing.
 * - Records with missing/invalid start dates are safely skipped and counted in unmappableCount.
 * - If end date is invalid or earlier than start, end date is omitted.
 */
export function mapRecordsToCalendarEvents<TData>(
  records: readonly TData[],
  getRowId: (row: TData) => string,
  mapping: CalendarEventMappingConfig
): EventMappingResult<TData> {
  const events: TransformedCalendarEvent<TData>[] = [];
  let unmappableCount = 0;

  for (const record of records) {
    if (!record || typeof record !== "object") {
      unmappableCount++;
      continue;
    }

    const id = getRowId(record);
    if (!id || typeof id !== "string" || !id.trim()) {
      unmappableCount++;
      continue;
    }

    const rawRecord = record as Record<string, unknown>;
    const rawStart = rawRecord[mapping.startKey];
    const parsedStart = parseValidDate(rawStart);

    if (!parsedStart) {
      unmappableCount++;
      continue;
    }

    const rawTitle = rawRecord[mapping.titleKey];
    const title =
      typeof rawTitle === "string" && rawTitle.trim()
        ? rawTitle.trim()
        : rawTitle !== undefined && rawTitle !== null && rawTitle !== ""
          ? String(rawTitle)
          : "(Untitled)";

    let validEndStr: string | undefined;
    if (mapping.endKey) {
      const rawEnd = rawRecord[mapping.endKey];
      const parsedEnd = parseValidDate(rawEnd);
      if (parsedEnd && !isBefore(parsedEnd, parsedStart)) {
        validEndStr =
          typeof rawEnd === "string" && rawEnd.trim()
            ? rawEnd.trim()
            : parsedEnd.toISOString();
      }
    }

    const rawAllDay = mapping.allDayKey ? rawRecord[mapping.allDayKey] : undefined;
    const allDay = parseStrictBoolean(rawAllDay, mapping.allDayDefault ?? false);

    const startStr =
      typeof rawStart === "string" && rawStart.trim()
        ? rawStart.trim()
        : parsedStart.toISOString();

    const rawColor = mapping.colorKey ? rawRecord[mapping.colorKey] : undefined;
    const color =
      typeof rawColor === "string" && rawColor.trim() ? rawColor.trim() : undefined;

    const rawDescription = mapping.descriptionKey
      ? rawRecord[mapping.descriptionKey]
      : undefined;
    const description =
      typeof rawDescription === "string" && rawDescription.trim()
        ? rawDescription.trim()
        : rawDescription !== undefined && rawDescription !== null
          ? String(rawDescription)
          : undefined;

    events.push({
      id: id.trim(),
      title,
      start: startStr,
      ...(validEndStr ? { end: validEndStr } : {}),
      allDay,
      ...(color
        ? {
            backgroundColor: color,
            borderColor: color,
          }
        : {}),
      extendedProps: {
        record,
        ...(description ? { description } : {}),
      },
    });
  }

  return {
    events,
    totalRecords: records.length,
    mappedCount: events.length,
    unmappableCount,
  };
}
