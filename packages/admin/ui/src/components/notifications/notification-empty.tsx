"use client";

import { Bell } from "lucide-react";
import { EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "../ui/empty";

export function NotificationEmpty() {
  return (
    <div className="px-4 py-10 flex flex-col items-center justify-center text-center">
      <EmptyHeader className="gap-1.5">
        <EmptyMedia variant="icon">
          <Bell className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle className="text-sm font-medium text-foreground">
          You're all caught up
        </EmptyTitle>
        <EmptyDescription className="text-xs text-muted-foreground">
          No new notifications.
        </EmptyDescription>
      </EmptyHeader>
    </div>
  );
}
