import React from 'react';
import FormField from '@alrehla/ui/form-field';
import { DatePicker as SharedDatePicker } from '@alrehla/ui/date-picker';

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
                <SharedDatePicker
                    id="start-date"
                    value={startDate}
                    max={endDate || undefined}
                    onChange={onStartDateChange}
                />
            </FormField>
            <FormField label="إلى تاريخ" htmlFor="end-date">
                <SharedDatePicker
                    id="end-date"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={onEndDateChange}
                />
            </FormField>
        </div>
    );
};

export default DatePicker;
