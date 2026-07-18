import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@alrehla/ui/button';
import { TableHead } from '@alrehla/ui/table';

interface SortableTableHeadProps<T> {
    sortKey: keyof T | string;
    label: string;
    sortConfig: { key: string; direction: 'asc' | 'desc' } | null;
    onSort: (key: string) => void;
}

const SortableTableHead = <T,>({ sortKey, label, sortConfig, onSort }: SortableTableHeadProps<T>) => (
    <TableHead>
        <Button variant="ghost" onClick={() => onSort(sortKey as string)} className="px-0 h-auto py-0">
            <div className="flex items-center">
                <span>{label}</span>
                {sortConfig?.key === sortKey && (
                    sortConfig.direction === 'asc' ? <ArrowUp className="h-4 w-4 mr-2" /> : <ArrowDown className="h-4 w-4 mr-2" />
                )}
            </div>
        </Button>
    </TableHead>
);

export default SortableTableHead;
