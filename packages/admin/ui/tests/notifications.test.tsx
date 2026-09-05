import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NotificationItem } from "../src/components/notifications/notification-item";
import { NotificationBell } from "../src/components/notifications/notification-bell";
import { NotificationList } from "../src/components/notifications/notification-list";
import { NotificationSkeleton } from "../src/components/notifications/notification-skeleton";
import { NotificationEmpty } from "../src/components/notifications/notification-empty";
import type { NotificationItemData } from "../src/components/notifications/notification-types";

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const baseItem: NotificationItemData = {
  id: "notif-1",
  title: "New order received",
  description: "Order #1234 from John Doe",
  timestamp: "2 min ago",
  unread: true,
  tone: "success",
};

const readItem: NotificationItemData = {
  ...baseItem,
  id: "notif-2",
  title: "Payment confirmed",
  unread: false,
};

// ---------------------------------------------------------------------------
// NotificationItem
// ---------------------------------------------------------------------------

describe("NotificationItem", () => {
  it("renders the title and description", () => {
    render(<NotificationItem notification={baseItem} />);
    expect(screen.getByText("New order received")).toBeTruthy();
    expect(screen.getByText("Order #1234 from John Doe")).toBeTruthy();
  });

  it("renders the timestamp", () => {
    render(<NotificationItem notification={baseItem} />);
    expect(screen.getByText("2 min ago")).toBeTruthy();
  });

  it("shows unread dot for unread notification", () => {
    const { container } = render(<NotificationItem notification={baseItem} />);
    // Unread dot is a span with aria-hidden
    const dots = container.querySelectorAll('[aria-hidden="true"]');
    expect(dots.length).toBeGreaterThan(0);
  });

  it("uses semibold font for unread items", () => {
    const { container } = render(<NotificationItem notification={baseItem} />);
    const titleEl = container.querySelector(".font-semibold");
    expect(titleEl).toBeTruthy();
  });

  it("calls onClick with the notification id when clicked", () => {
    const onClick = vi.fn();
    render(<NotificationItem notification={baseItem} onClick={onClick} />);
    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledWith("notif-1");
  });

  it("is a native button element", () => {
    render(<NotificationItem notification={baseItem} />);
    const button = screen.getByRole("button");
    expect(button.tagName).toBe("BUTTON");
    expect(button.getAttribute("type")).toBe("button");
  });

  it("responds to keyboard Enter key", () => {
    const onClick = vi.fn();
    render(<NotificationItem notification={baseItem} onClick={onClick} />);
    const button = screen.getByRole("button");
    fireEvent.keyDown(button, { key: "Enter" });
    expect(onClick).toHaveBeenCalledWith("notif-1");
  });

  it("does not call onClick for other keys", () => {
    const onClick = vi.fn();
    render(<NotificationItem notification={baseItem} onClick={onClick} />);
    const button = screen.getByRole("button");
    fireEvent.keyDown(button, { key: "Tab" });
    expect(onClick).not.toHaveBeenCalled();
  });

  it("renders without description", () => {
    const { description: _description, ...noDesc } = baseItem;
    render(<NotificationItem notification={noDesc} />);
    expect(screen.queryByText("Order #1234 from John Doe")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// NotificationBell
// ---------------------------------------------------------------------------

describe("NotificationBell", () => {
  it("renders with zero unread count", () => {
    render(<NotificationBell unreadCount={0} />);
    const button = screen.getByRole("button");
    expect(button.getAttribute("aria-label")).toBe("Notifications");
  });

  it("shows singular label for 1 unread", () => {
    render(<NotificationBell unreadCount={1} />);
    const button = screen.getByRole("button");
    expect(button.getAttribute("aria-label")).toBe("Notifications, 1 unread");
  });

  it("shows plural label for multiple unread", () => {
    render(<NotificationBell unreadCount={5} />);
    const button = screen.getByRole("button");
    expect(button.getAttribute("aria-label")).toBe("Notifications, 5 unread");
  });

  it("caps badge at 99+", () => {
    render(<NotificationBell unreadCount={150} />);
    expect(
      screen.getByText("99+", { selector: '[aria-hidden="true"]' })
    ).toBeTruthy();
  });

  it("does not show badge when unreadCount is 0", () => {
    render(<NotificationBell unreadCount={0} />);
    expect(
      screen.queryByText("0", { selector: '[aria-hidden="true"]' })
    ).toBeNull();
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    render(<NotificationBell unreadCount={3} onClick={onClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalled();
  });

  it("is a native button element", () => {
    render(<NotificationBell />);
    const button = screen.getByRole("button");
    expect(button.tagName).toBe("BUTTON");
    expect(button.getAttribute("type")).toBe("button");
  });
});

// ---------------------------------------------------------------------------
// NotificationSkeleton
// ---------------------------------------------------------------------------

describe("NotificationSkeleton", () => {
  it("renders with accessible busy/label attributes", () => {
    const { container } = render(<NotificationSkeleton />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.getAttribute("aria-label")).toBe("Loading notifications");
    expect(wrapper.getAttribute("aria-busy")).toBe("true");
  });
});

// ---------------------------------------------------------------------------
// NotificationEmpty
// ---------------------------------------------------------------------------

describe("NotificationEmpty", () => {
  it("renders 'all caught up' message", () => {
    render(<NotificationEmpty />);
    expect(screen.getByText("You're all caught up")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// NotificationList
// ---------------------------------------------------------------------------

describe("NotificationList", () => {
  it("renders loading skeleton when isLoading=true and no items", () => {
    render(<NotificationList notifications={[]} isLoading />);
    expect(screen.getByLabelText("Loading notifications")).toBeTruthy();
  });

  it("renders empty state when no notifications", () => {
    render(<NotificationList notifications={[]} />);
    expect(screen.getByText("You're all caught up")).toBeTruthy();
  });

  it("renders error state with retry button", () => {
    const onRetry = vi.fn();
    render(
      <NotificationList
        notifications={[]}
        error="Network error"
        onRetry={onRetry}
      />
    );
    expect(screen.getByRole("alert")).toBeTruthy();
    const retryBtn = screen.getByRole("button", { name: /retry/i });
    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalled();
  });

  it("renders a list of notifications", () => {
    render(
      <NotificationList
        notifications={[baseItem, readItem]}
        onItemClick={() => {}}
      />
    );
    expect(screen.getByText("New order received")).toBeTruthy();
    expect(screen.getByText("Payment confirmed")).toBeTruthy();
  });

  it("uses role=list and role=listitem", () => {
    render(<NotificationList notifications={[baseItem]} />);
    const list = screen.getByRole("list");
    expect(list).toBeTruthy();
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Domain separation audit
// ---------------------------------------------------------------------------

describe("Domain separation — Admin UI notifications", () => {
  it("NotificationItemData has no domain-specific fields", () => {
    const item: NotificationItemData = {
      id: "x",
      title: "Test",
      timestamp: "now",
      unread: false,
    };
    // The type should only have generic fields — just a compile-time check via usage
    expect(item).toBeDefined();
    // @ts-expect-error — should not have an 'orderId' field
    const _orderId = item.orderId; // biome-ignore lint/correctness/noUnusedVariables
  });
});
