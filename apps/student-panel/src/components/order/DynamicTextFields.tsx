"use client";


import React from 'react';
import FormField from '@alrehla/ui/form-field';
import { Textarea } from '@alrehla/ui/textarea';
import { Input } from '@alrehla/ui/input';
import type { TextFieldConfig } from '../../lib/database.types';
import { useFormContext } from 'react-hook-form';

const DynamicTextFields: React.FC<{
    fields: TextFieldConfig[];
}> = ({ fields }) => {
    const { register, formState: { errors } } = useFormContext();

    return (
        <div className="space-y-6">
            {fields.map(field => (
                <FormField key={field.id} label={field.label} htmlFor={field.id} error={errors[field.id]?.message as string}>
                    {field.type === 'textarea' ? (
                        <Textarea id={field.id} {...register(field.id)} rows={4} placeholder={field.placeholder} />
                    ) : (
                        <Input id={field.id} {...register(field.id)} placeholder={field.placeholder} />
                    )}
                </FormField>
            ))}
        </div>
    );
};

export default DynamicTextFields;
