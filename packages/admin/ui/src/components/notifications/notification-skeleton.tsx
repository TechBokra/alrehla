"use client";

import { Skeleton } from "../ui/skeleton";

export function NotificationSkeleton() {
  return (
    <div aria-label="Loading notifications" aria-busy="true">
      {Array.from({ length: 3 }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
        <div key={i} className="px-4 py-3 flex items-start gap-3">
          <Skeleton className="mt-1.5 h-2 w-2 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-3/4 rounded" />
            <Skeleton className="h-3 w-full rounded" />
            <Skeleton className="h-2.5 w-1/3 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
