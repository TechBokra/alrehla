import { describe, expect, it } from "vitest";
import {
  mapRecordsToCalendarEvents,
  parseStrictBoolean,
} from "../src/components/calendar/calendar-event-mapping";

describe("parseStrictBoolean", () => {
  it("parses explicit true values without truthiness coercion", () => {
    expect(parseStrictBoolean(true)).toBe(true);
    expect(parseStrictBoolean("true")).toBe(true);
    expect(parseStrictBoolean(1)).toBe(true);
    expect(parseStrictBoolean("1")).toBe(true);
  });

  it("parses explicit false values without treating string as truthy", () => {
    expect(parseStrictBoolean(false)).toBe(false);
    expect(parseStrictBoolean("false")).toBe(false);
    expect(parseStrictBoolean(0)).toBe(false);
    expect(parseStrictBoolean("0")).toBe(false);
  });

  it("uses fallback when value is undefined, null, or unknown", () => {
    expect(parseStrictBoolean(undefined, false)).toBe(false);
    expect(parseStrictBoolean(null, false)).toBe(false);
    expect(parseStrictBoolean(undefined, true)).toBe(true);
    expect(parseStrictBoolean("random", false)).toBe(false);
    expect(parseStrictBoolean("random", true)).toBe(true);
  });
});

describe("mapRecordsToCalendarEvents", () => {
  const defaultMapping = {
    titleKey: "name",
    startKey: "startsAt",
    endKey: "endsAt",
    allDayKey: "isAllDay",
  };

  it("strictly uses getRowId for event id with zero fallback to record.id or array index", () => {
    const records = [
      { id: "fallback-id-1", name: "Event 1", startsAt: "2026-09-01T10:00:00Z" },
      { id: "fallback-id-2", name: "Event 2", startsAt: "2026-09-02T10:00:00Z" },
    ];

    const getRowId = (r: unknown) => `row-${(r as { name: string }).name}`;
    const result = mapRecordsToCalendarEvents(records, getRowId, defaultMapping);

    expect(result.events).toHaveLength(2);
    expect(result.events[0]!.id).toBe("row-Event 1");
    expect(result.events[1]!.id).toBe("row-Event 2");
    expect(result.mappedCount).toBe(2);
    expect(result.unmappableCount).toBe(0);
  });

  it("skips records if getRowId returns empty or whitespace", () => {
    const records = [
      { id: "record-1", name: "Valid", startsAt: "2026-09-01T10:00:00Z" },
      { id: "record-2", name: "No ID", startsAt: "2026-09-02T10:00:00Z" },
    ];

    const getRowId = (r: unknown) =>
      (r as { name: string }).name === "No ID" ? "" : "valid-id";
    const result = mapRecordsToCalendarEvents(records, getRowId, defaultMapping);

    expect(result.events).toHaveLength(1);
    expect(result.events[0]!.id).toBe("valid-id");
    expect(result.unmappableCount).toBe(1);
  });

  it("skips records with missing, empty, or invalid start dates", () => {
    const records = [
      { id: "1", name: "Valid", startsAt: "2026-09-01T10:00:00Z" },
      { id: "2", name: "Missing Start" },
      { id: "3", name: "Empty Start", startsAt: "   " },
      { id: "4", name: "Invalid Start", startsAt: "not-a-valid-date" },
    ];

    const getRowId = (r: unknown) => (r as { id: string }).id;
    const result = mapRecordsToCalendarEvents(records, getRowId, defaultMapping);

    expect(result.events).toHaveLength(1);
    expect(result.events[0]!.title).toBe("Valid");
    expect(result.totalRecords).toBe(4);
    expect(result.mappedCount).toBe(1);
    expect(result.unmappableCount).toBe(3);
  });

  it("omits end date when end is earlier than start (end < start)", () => {
    const records = [
      {
        id: "1",
        name: "Inverted Range",
        startsAt: "2026-09-05T12:00:00Z",
        endsAt: "2026-09-05T10:00:00Z", // 2 hours earlier!
      },
    ];

    const getRowId = (r: unknown) => (r as { id: string }).id;
    const result = mapRecordsToCalendarEvents(records, getRowId, defaultMapping);

    expect(result.events).toHaveLength(1);
    expect(result.events[0]!.start).toBe("2026-09-05T12:00:00Z");
    expect(result.events[0]!.end).toBeUndefined(); // end omitted
  });

  it("omits end date when end is invalid date string", () => {
    const records = [
      {
        id: "1",
        name: "Invalid End",
        startsAt: "2026-09-05T12:00:00Z",
        endsAt: "garbage-end-date",
      },
    ];

    const getRowId = (r: unknown) => (r as { id: string }).id;
    const result = mapRecordsToCalendarEvents(records, getRowId, defaultMapping);

    expect(result.events).toHaveLength(1);
    expect(result.events[0]!.end).toBeUndefined();
  });

  it("falls back to (Untitled) without guessing other unconfigured fields", () => {
    const records = [
      {
        id: "1",
        title: "Heuristic Title", // Mapping specifies "name", not "title"
        subject: "Subject Title",
        startsAt: "2026-09-01T10:00:00Z",
      },
    ];

    const getRowId = (r: unknown) => (r as { id: string }).id;
    const result = mapRecordsToCalendarEvents(records, getRowId, defaultMapping);

    expect(result.events).toHaveLength(1);
    // Does NOT guess "title" or "subject"
    expect(result.events[0]!.title).toBe("(Untitled)");
  });

  it("preserves source record in extendedProps.record", () => {
    const record = {
      id: "1",
      name: "Campaign",
      startsAt: "2026-09-01T10:00:00Z",
      customData: { foo: "bar" },
    };

    const getRowId = (r: unknown) => (r as { id: string }).id;
    const result = mapRecordsToCalendarEvents([record], getRowId, defaultMapping);

    expect(result.events[0]!.extendedProps.record).toBe(record);
  });
});
