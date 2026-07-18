import React from 'react';
import { Input } from '@alrehla/ui/input';
import FormField from '@alrehla/ui/form-field';

interface DatePickerProps {
    startDate: string;
    endDate: string;
    onStartDateChange: (date: string) => void;
    onEndDateChange: (date: string) => void;
}

const DatePicker: React.FC<DatePickerProps> = ({ startDate, endDate, onStartDateChange, onEndDateChange }) => {
    return (
        <div className="grid grid-cols-2 gap-4">
            <FormField label="من تاريخ" htmlFor="start-date">
                <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => onStartDateChange(e.target.value)}
                />
            </FormField>
            <FormField label="إلى تاريخ" htmlFor="end-date">
                <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => onEndDateChange(e.target.value)}
                    min={startDate}
                />
            </FormField>
        </div>
    );
};

export default DatePicker;
