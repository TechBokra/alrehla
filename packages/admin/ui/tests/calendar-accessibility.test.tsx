import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CalendarView } from "../src/components/calendar/calendar-view";
import type { CalendarViewConfig } from "../src/components/calendar/calendar-types";

describe("Calendar Keyboard Accessibility & Interaction", () => {
  const sampleConfig: CalendarViewConfig = {
    eventMapping: {
      titleKey: "name",
      startKey: "startsAt",
    },
    defaultMode: "dayGridMonth",
    initialDate: "2026-09-01",
  };

  const sampleRecord = {
    id: "promo-1",
    name: "VIP Early Access",
    startsAt: "2026-09-10T10:00:00Z",
  };

  const getRowId = (row: unknown) => (row as { id: string }).id;

  it("adds tabIndex=0, role=button, and accessible aria-label to event elements", async () => {
    const { container } = render(
      <CalendarView
        data={[sampleRecord]}
        getRowId={getRowId}
        config={sampleConfig}
      />
    );

    await waitFor(() => {
      const eventElement = container.querySelector<HTMLElement>(
        '[aria-label="Calendar event: VIP Early Access"]'
      );
      expect(eventElement).toBeTruthy();
      expect(eventElement?.getAttribute("role")).toBe("button");
      expect(eventElement?.getAttribute("tabindex")).toBe("0");
    });
  });

  it("invokes onEventClick when Enter key is pressed on a focused event", async () => {
    const onEventClick = vi.fn();

    const { container } = render(
      <CalendarView
        data={[sampleRecord]}
        getRowId={getRowId}
        config={sampleConfig}
        onEventClick={onEventClick}
      />
    );

    const eventElement = await waitFor(() => {
      const el = container.querySelector<HTMLElement>(
        '[aria-label="Calendar event: VIP Early Access"]'
      );
      if (!el) throw new Error("Event not mounted yet");
      return el;
    });

    eventElement.focus();
    fireEvent.keyDown(eventElement, { key: "Enter", code: "Enter" });

    expect(onEventClick).toHaveBeenCalledTimes(1);
    expect(onEventClick).toHaveBeenCalledWith(sampleRecord);
  });

  it("invokes onEventClick and prevents default scroll when Space key is pressed", async () => {
    const onEventClick = vi.fn();

    const { container } = render(
      <CalendarView
        data={[sampleRecord]}
        getRowId={getRowId}
        config={sampleConfig}
        onEventClick={onEventClick}
      />
    );

    const eventElement = await waitFor(() => {
      const el = container.querySelector<HTMLElement>(
        '[aria-label="Calendar event: VIP Early Access"]'
      );
      if (!el) throw new Error("Event not mounted yet");
      return el;
    });

    eventElement.focus();
    const event = new KeyboardEvent("keydown", {
      key: " ",
      code: "Space",
      bubbles: true,
      cancelable: true,
    });
    const preventDefaultSpy = vi.spyOn(event, "preventDefault");

    eventElement.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(onEventClick).toHaveBeenCalledTimes(1);
    expect(onEventClick).toHaveBeenCalledWith(sampleRecord);
  });

  it("prevents duplicate execution between rapid keyboard or mouse events", async () => {
    const onEventClick = vi.fn();

    const { container } = render(
      <CalendarView
        data={[sampleRecord]}
        getRowId={getRowId}
        config={sampleConfig}
        onEventClick={onEventClick}
      />
    );

    const eventElement = await waitFor(() => {
      const el = container.querySelector<HTMLElement>(
        '[aria-label="Calendar event: VIP Early Access"]'
      );
      if (!el) throw new Error("Event not mounted yet");
      return el;
    });

    // Simulate Enter key followed immediately by click (e.g. browser synthetic event bubbling)
    fireEvent.keyDown(eventElement, { key: "Enter" });
    fireEvent.click(eventElement);

    expect(onEventClick).toHaveBeenCalledTimes(1);
  });
});
