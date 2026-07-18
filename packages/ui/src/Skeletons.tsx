import React from 'react';
import { Skeleton } from './components/ui/skeleton';
import { Card, CardContent, CardFooter, CardHeader } from './components/ui/card';
import { TableCell, TableRow } from './components/ui/table';

// 1. Product Card Skeleton
export const ProductCardSkeleton = () => (
    <Card className="flex flex-col h-full overflow-hidden">
        <Skeleton className="h-64 w-full rounded-none" />
        <CardHeader className="space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="flex-grow space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
        </CardContent>
        <CardFooter>
            <Skeleton className="h-10 w-full rounded-md" />
        </CardFooter>
    </Card>
);

// 2. Admin Table Row Skeleton
export const TableRowSkeleton: React.FC<{ cols?: number }> = ({ cols = 5 }) => (
    <TableRow>
        {Array.from({ length: cols }).map((_, i) => (
            <TableCell key={i}>
                <Skeleton className="h-6 w-full min-w-[80px]" />
            </TableCell>
        ))}
    </TableRow>
);

// 3. Admin Dashboard Skeleton
export const DashboardSkeleton = () => (
    <div className="space-y-8 animate-fadeIn">
        {/* Header */}
        <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-32" />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-4 rounded-full" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-16 mb-1" />
                        <Skeleton className="h-3 w-32" />
                    </CardContent>
                </Card>
            ))}
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 space-y-8">
                <Card className="h-96">
                    <CardHeader>
                        <Skeleton className="h-6 w-48" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </CardContent>
                </Card>
            </div>
            <div className="xl:col-span-1 space-y-8">
                <Card className="h-80">
                    <CardHeader>
                        <Skeleton className="h-6 w-32" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
);

// 4. Instructor/Profile Card Skeleton
export const ProfileCardSkeleton = () => (
    <div className="bg-white rounded-2xl p-6 text-center border flex flex-col items-center shadow-sm">
        <Skeleton className="w-24 h-24 rounded-full mb-4" />
        <Skeleton className="h-6 w-32 mb-2" />
        <Skeleton className="h-4 w-24 mb-4" />
        <Skeleton className="h-10 w-full rounded-full mt-auto" />
    </div>
);