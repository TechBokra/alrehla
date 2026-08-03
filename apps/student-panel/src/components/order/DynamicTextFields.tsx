"use client";


import React from 'react';
import FormField from '@alrehla/ui/form-field';
import { Textarea } from '@alrehla/ui/textarea';
import { Input } from '@alrehla/ui/input';
import type { TextFieldConfig } from '../../lib/database.types';
import type { OrderFormApi } from './form-types';
import { getFieldError } from './form-types';

const DynamicTextFields: React.FC<{
    fields: TextFieldConfig[];
    form: OrderFormApi;
}> = ({ fields, form }) => {

    return (
        <div className="space-y-6">
            {fields.map(field => (
                <form.Field key={field.id} name={field.id}>
                    {(fieldApi: any) => (
                        <FormField key={field.id} label={field.label} htmlFor={field.id} error={getFieldError(fieldApi)}>
                            {field.type === 'textarea' ? (
                                <Textarea
                                    id={field.id}
                                    value={fieldApi.state.value || ''}
                                    onChange={(event) => fieldApi.handleChange(event.target.value)}
                                    onBlur={fieldApi.handleBlur}
                                    rows={4}
                                    placeholder={field.placeholder}
                                />
                            ) : (
                                <Input
                                    id={field.id}
                                    value={fieldApi.state.value || ''}
                                    onChange={(event) => fieldApi.handleChange(event.target.value)}
                                    onBlur={fieldApi.handleBlur}
                                    placeholder={field.placeholder}
                                />
                            )}
                        </FormField>
                    )}
                </form.Field>
            ))}
        </div>
    );
};

export default DynamicTextFields;
