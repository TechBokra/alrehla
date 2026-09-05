"use client";

import * as React from "react";
import { Check, ExternalLink } from "lucide-react";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Separator } from "../ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import { NotificationBell } from "./notification-bell";
import { NotificationList } from "./notification-list";
import type { NotificationItemData } from "./notification-types";

export interface NotificationCenterSharedProps {
  notifications: NotificationItemData[];
  unreadCount?: number;
  isLoading?: boolean;
  error?: string | null;
  onItemClick?: (id: string) => void;
  onMarkAllRead?: () => void;
  onViewAll?: () => void;
  onRetry?: () => void;
  isMarkingAllRead?: boolean;
}

interface NotificationCenterBodyProps extends NotificationCenterSharedProps {
  onClose?: () => void;
}

/** Shared header + list + footer rendered inside both Popover and Sheet. */
function NotificationCenterBody({
  notifications,
  unreadCount = 0,
  isLoading,
  error,
  onItemClick,
  onMarkAllRead,
  onViewAll,
  onRetry,
  isMarkingAllRead,
}: NotificationCenterBodyProps) {
  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">
          Notifications
        </h2>
        {unreadCount > 0 && onMarkAllRead && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onMarkAllRead}
            disabled={isMarkingAllRead}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1.5"
          >
            <Check className="h-3 w-3" aria-hidden="true" />
            {isMarkingAllRead ? "Marking..." : "Mark all read"}
          </Button>
        )}
      </div>
      <Separator />

      {/* Notification list */}
      <NotificationList
        notifications={notifications}
        isLoading={isLoading ?? false}
        {...(error !== undefined ? { error } : {})}
        {...(onItemClick ? { onItemClick } : {})}
        {...(onRetry ? { onRetry } : {})}
        maxHeight={420}
      />

      {/* Footer */}
      {onViewAll && (
        <>
          <Separator />
          <div className="px-4 py-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onViewAll}
              className="w-full justify-between text-xs text-muted-foreground hover:text-foreground h-8"
            >
              View all notifications
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export interface NotificationCenterProps extends NotificationCenterSharedProps {
  className?: string;
}

/**
 * Responsive Notification Center:
 * - Desktop (≥768px): Shadcn Popover
 * - Mobile (<768px): Shadcn Sheet
 */
export function NotificationCenter({
  notifications,
  unreadCount = 0,
  isLoading,
  error,
  onItemClick,
  onMarkAllRead,
  onViewAll,
  onRetry,
  isMarkingAllRead,
  className,
}: NotificationCenterProps) {
  const [desktopOpen, setDesktopOpen] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleItemClick = (id: string) => {
    setDesktopOpen(false);
    setMobileOpen(false);
    onItemClick?.(id);
  };

  const handleViewAll = () => {
    setDesktopOpen(false);
    setMobileOpen(false);
    onViewAll?.();
  };

  const sharedBodyProps: NotificationCenterBodyProps = {
    notifications,
    unreadCount,
    isLoading: isLoading ?? false,
    ...(error !== undefined ? { error } : {}),
    onItemClick: handleItemClick,
    ...(onMarkAllRead ? { onMarkAllRead } : {}),
    onViewAll: handleViewAll,
    ...(onRetry ? { onRetry } : {}),
    isMarkingAllRead: isMarkingAllRead ?? false,
  };

  return (
    <>
      {/* Desktop: Popover (hidden on mobile) */}
      <span className="hidden sm:inline-flex">
        <Popover open={desktopOpen} onOpenChange={setDesktopOpen}>
          <PopoverTrigger asChild>
            <NotificationBell
              unreadCount={unreadCount}
              onClick={() => setDesktopOpen((prev) => !prev)}
              {...(className ? { className } : {})}
            />
          </PopoverTrigger>
          <PopoverContent
            className="w-96 p-0 shadow-xl"
            align="end"
            sideOffset={8}
          >
            <NotificationCenterBody {...sharedBodyProps} onClose={() => setDesktopOpen(false)} />
          </PopoverContent>
        </Popover>
      </span>

      {/* Mobile: Sheet (hidden on sm+) */}
      <span className="inline-flex sm:hidden">
        <NotificationBell
          unreadCount={unreadCount}
          onClick={() => setMobileOpen(true)}
          {...(className ? { className } : {})}
        />
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="right" className="w-full sm:w-96 p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Notifications</SheetTitle>
            </SheetHeader>
            <NotificationCenterBody {...sharedBodyProps} onClose={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
      </span>
    </>
  );
}
