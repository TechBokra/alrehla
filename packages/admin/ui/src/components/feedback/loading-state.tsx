import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { Skeleton } from "../ui/skeleton";
import { TableCell, TableRow } from "../ui/table";

export interface LoadingStateProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
}

export function LoadingState({
  label = "Loading data...",
  className,
  ...props
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-12 text-center text-muted-foreground",
        className
      )}
      {...props}
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

export function TableSkeleton({
  columns = 5,
  rows = 5,
}: {
  columns?: number;
  rows?: number;
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <TableRow key={rowIndex}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <TableCell key={colIndex}>
              {colIndex === 0 ? (
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ) : colIndex === 1 ? (
                <Skeleton className="h-5 w-16 rounded-md" />
              ) : colIndex === columns - 2 ? (
                <Skeleton className="h-6 w-16 rounded-full" />
              ) : colIndex === columns - 1 ? (
                <div className="flex justify-end">
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              ) : (
                <Skeleton className="h-4 w-20" />
              )}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export interface DataTablePageSkeletonProps {
  title?: string;
  columns?: number;
  rows?: number;
  showToolbar?: boolean;
}

export function DataTablePageSkeleton({
  columns = 6,
  rows = 6,
  showToolbar = true,
}: DataTablePageSkeletonProps) {
  return (
    <div className="space-y-6 w-full animate-in fade-in-50 duration-300">
      {/* Header Section Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44 rounded-lg" />
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>

      {/* Toolbar Section Skeleton (Search + Filters + Action Buttons) */}
      {showToolbar && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-64 rounded-md" />
            <Skeleton className="h-9 w-28 rounded-md" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-24 rounded-md" />
          </div>
        </div>
      )}

      {/* Data Table Shell Skeleton */}
      <div className="space-y-4">
        <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
          <div className="border-b bg-muted/40 px-4 py-3">
            <div className="flex items-center justify-between">
              {Array.from({ length: columns }).map((_, i) => (
                <Skeleton
                  key={i}
                  className={cn(
                    "h-4 rounded-md",
                    i === 0 ? "w-28" : i === columns - 1 ? "w-8" : "w-16"
                  )}
                />
              ))}
            </div>
          </div>
          <div className="divide-y divide-border">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <div
                key={rowIndex}
                className="flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-32 rounded-md" />
                    <Skeleton className="h-3 w-20 rounded-md" />
                  </div>
                </div>
                <Skeleton className="h-5 w-14 rounded-md hidden sm:block" />
                <Skeleton className="h-4 w-12 hidden md:block" />
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-4 w-12 hidden lg:block" />
                <Skeleton className="h-4 w-20 hidden md:block" />
                <Skeleton className="h-8 w-8 rounded-md shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Footer Pagination Skeleton */}
        <div className="flex items-center justify-between px-2 pt-1">
          <Skeleton className="h-4 w-28 rounded-md" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-4 w-12 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
