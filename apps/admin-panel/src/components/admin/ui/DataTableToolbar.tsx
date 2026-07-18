import React from 'react';
import { Input } from '@alrehla/ui/input';
import { Button } from '@alrehla/ui/button';

// This is a placeholder for a data table toolbar.
// It would typically include filtering, column visibility, etc.

const DataTableToolbar = () => {
    return (
        <div className="flex items-center justify-between">
            <div className="flex flex-1 items-center space-x-2">
                <Input placeholder="Filter..." className="h-8 w-[150px] lg:w-[250px]" />
            </div>
            <Button variant="outline" size="sm" className="ml-auto h-8">
                View
            </Button>
        </div>
    );
}

export default DataTableToolbar;
