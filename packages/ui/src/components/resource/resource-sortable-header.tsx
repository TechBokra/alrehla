import type { Column } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { Button } from '../ui/button';

export function ResourceSortableHeader<TData, TValue>({
  column,
  label,
}: {
  column: Column<TData, TValue>;
  label: string;
}) {
  const sorted = column.getIsSorted();
  const icon = sorted === 'asc'
    ? <ArrowUp className="h-4 w-4" aria-hidden="true" />
    : sorted === 'desc'
      ? <ArrowDown className="h-4 w-4" aria-hidden="true" />
      : <ChevronsUpDown className="h-4 w-4" aria-hidden="true" />;

  return (
    <Button
      type="button"
      variant="ghost"
      className="h-auto px-0 py-0"
      onClick={column.getToggleSortingHandler()}
      aria-label={`ترتيب حسب ${label}`}
    >
      <span className="flex items-center gap-1">
        {label}
        {icon}
      </span>
    </Button>
  );
}
