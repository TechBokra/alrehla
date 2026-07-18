
import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@alrehla/ui/table';
import { Checkbox } from '@alrehla/ui/checkbox';
import Dropdown from '@alrehla/ui/dropdown-wrapper';
import { Button } from '@alrehla/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUp, ArrowDown, Hand, Inbox } from 'lucide-react';

interface ColumnDef<T> {
    accessorKey: string;
    header: string;
    cell?: (props: { value: any, row: T }) => React.ReactNode;
}

interface BulkAction<T> {
    label: string;
    action: (selected: T[]) => void;
    isDestructive?: boolean;
}

interface DataTableProps<T> {
    data: T[];
    columns: ColumnDef<T>[];
    bulkActions?: BulkAction<T>[];
    renderRowActions?: (item: T) => React.ReactNode;
    pageSize?: number;
    initialSort?: { key: string; direction: 'asc' | 'desc' };
    emptyMessage?: string;
}

const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((acc, part) => acc && acc[part] !== undefined && acc[part] !== null ? acc[part] : undefined, obj);
};

function DataTable<T extends { id: any }>({ 
    data, 
    columns, 
    bulkActions, 
    renderRowActions, 
    pageSize = 10,
    initialSort,
    emptyMessage = "لا توجد بيانات متاحة للعرض."
}: DataTableProps<T>) {
    const [selectedRowIds, setSelectedRowIds] = useState<Set<any>>(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(pageSize);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(initialSort || null);

    useMemo(() => {
        setCurrentPage(1);
    }, [data.length]);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedData = useMemo(() => {
        if (!sortConfig) return data;
        return [...data].sort((a, b) => {
            const aVal = getNestedValue(a, sortConfig.key);
            const bVal = getNestedValue(b, sortConfig.key);
            
            if (aVal === null || aVal === undefined) return 1;
            if (bVal === null || bVal === undefined) return -1;
            
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data, sortConfig]);

    const totalPages = Math.ceil(sortedData.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const currentData = sortedData.slice(startIndex, startIndex + rowsPerPage);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const newSet = new Set(selectedRowIds);
            currentData.forEach(row => newSet.add(row.id));
            setSelectedRowIds(newSet);
        } else {
            const newSet = new Set(selectedRowIds);
            currentData.forEach(row => newSet.delete(row.id));
            setSelectedRowIds(newSet);
        }
    };

    const handleSelectRow = (id: any, checked: boolean) => {
        const newSelectedRowIds = new Set(selectedRowIds);
        if (checked) {
            newSelectedRowIds.add(id);
        } else {
            newSelectedRowIds.delete(id);
        }
        setSelectedRowIds(newSelectedRowIds);
    };

    const selectedDataItems = useMemo(() => {
        return data.filter(row => selectedRowIds.has(row.id));
    }, [data, selectedRowIds]);
    
    const dropdownItems = bulkActions?.map(action => ({
        label: action.label,
        action: () => {
            action.action(selectedDataItems);
            setSelectedRowIds(new Set());
        },
        isDestructive: action.isDestructive
    }));

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-2 min-h-[32px]">
                {bulkActions && selectedRowIds.size > 0 ? (
                    <div className="flex items-center gap-4 animate-fadeIn">
                        <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                            {selectedRowIds.size} محدد
                        </span>
                        {dropdownItems && <Dropdown trigger="خيارات مجمعة" items={dropdownItems} />}
                    </div>
                ) : <div className="hidden sm:block"></div>}
                
                <div className="text-xs text-muted-foreground mr-auto sm:mr-0 font-medium">
                    إجمالي السجلات: {data.length}
                </div>
            </div>

            <div className="rounded-xl border bg-white shadow-sm overflow-hidden relative">
                {/* Mobile Scroll Hint */}
                <div className="sm:hidden absolute top-2 left-2 z-10 pointer-events-none opacity-60 bg-white/90 px-2 py-1 rounded text-[10px] flex items-center gap-1 text-gray-600 shadow-sm border">
                    <Hand size={12} /> اسحب للعرض
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <Table className="min-w-[800px] sm:min-w-full">
                        <TableHeader>
                            <TableRow className="bg-muted/40 hover:bg-muted/50">
                                {bulkActions && (
                                    <TableHead className="w-12 text-center p-0">
                                        <div className="flex items-center justify-center h-full">
                                            <Checkbox
                                                checked={currentData.length > 0 && currentData.every(row => selectedRowIds.has(row.id))}
                                                onCheckedChange={handleSelectAll}
                                                aria-label="Select all"
                                            />
                                        </div>
                                    </TableHead>
                                )}
                                {columns.map(column => (
                                    <TableHead key={column.accessorKey} className="whitespace-nowrap h-12">
                                        <Button 
                                            variant="ghost" 
                                            onClick={() => handleSort(column.accessorKey)} 
                                            className="px-2 h-full w-full justify-start hover:bg-transparent font-bold text-muted-foreground hover:text-foreground text-xs sm:text-sm rounded-none"
                                        >
                                            <div className="flex items-center gap-1">
                                                {column.header}
                                                {sortConfig?.key === column.accessorKey && (
                                                    sortConfig.direction === 'asc' ? <ArrowUp size={14} className="text-primary"/> : <ArrowDown size={14} className="text-primary"/>
                                                )}
                                            </div>
                                        </Button>
                                    </TableHead>
                                ))}
                                {renderRowActions && <TableHead className="font-bold text-center w-24">إجراءات</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {currentData.length > 0 ? (
                                currentData.map((row, rowIndex) => (
                                    <TableRow key={(row as any).id ?? rowIndex} className="hover:bg-blue-50/30 transition-colors border-b last:border-0">
                                        {bulkActions && (
                                            <TableCell className="text-center p-0">
                                                 <div className="flex items-center justify-center h-full">
                                                    <Checkbox
                                                        checked={selectedRowIds.has((row as any).id)}
                                                        onCheckedChange={(checked) => handleSelectRow((row as any).id, !!checked)}
                                                        aria-label={`Select row ${rowIndex + 1}`}
                                                    />
                                                </div>
                                            </TableCell>
                                        )}
                                        {columns.map(column => {
                                            const value = getNestedValue(row, column.accessorKey);
                                            return (
                                                <TableCell key={column.accessorKey} className="py-3 text-sm">
                                                    {column.cell ? column.cell({ value, row }) : (value ?? '-')}
                                                </TableCell>
                                            );
                                        })}
                                        {renderRowActions && (
                                            <TableCell>
                                                <div className="flex items-center justify-center gap-1">
                                                    {renderRowActions(row)}
                                                </div>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length + (bulkActions ? 1 : 0) + (renderRowActions ? 1 : 0)} className="h-48 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center gap-3 opacity-60">
                                            <Inbox size={40} strokeWidth={1.5} />
                                            <p>{emptyMessage}</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2 bg-gray-50 p-2 rounded-lg border">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground w-full sm:w-auto justify-center">
                        <span>عرض</span>
                        <select 
                            value={rowsPerPage} 
                            onChange={(e) => {
                                setRowsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="border rounded p-1 bg-white text-xs h-8 cursor-pointer focus:ring-1 focus:ring-primary"
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                        <span>في الصفحة</span>
                    </div>

                    <div className="flex items-center gap-1 justify-center w-full sm:w-auto">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => setCurrentPage(1)} 
                            disabled={currentPage === 1}
                        >
                            <ChevronsRight size={16} className="rtl:rotate-180" />
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                            disabled={currentPage === 1}
                        >
                            <ChevronRight size={16} className="rtl:rotate-180" />
                        </Button>
                        
                        <span className="text-sm font-bold mx-3 min-w-[3rem] text-center bg-white px-2 py-1 rounded border shadow-sm">
                            {currentPage} / {totalPages}
                        </span>

                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                            disabled={currentPage === totalPages}
                        >
                            <ChevronLeft size={16} className="rtl:rotate-180" />
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => setCurrentPage(totalPages)} 
                            disabled={currentPage === totalPages}
                        >
                            <ChevronsLeft size={16} className="rtl:rotate-180" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DataTable;
