"use client";


import React from 'react';
import FormField from '@alrehla/ui/form-field';
import { Select } from '@alrehla/ui/native-select';
import { Textarea } from '@alrehla/ui/textarea';
import type { TextFieldConfig, StoryGoal, GoalConfig } from '../../lib/database.types';
import DynamicTextFields from './DynamicTextFields';
import type { OrderFormApi } from './form-types';
import { getFieldError } from './form-types';

interface StoryCustomizationSectionProps {
    textFields: TextFieldConfig[] | null;
    goalConfig: GoalConfig;
    storyGoals: StoryGoal[];
    sectionTitle?: string;
    form: OrderFormApi;
}

const StoryCustomizationSection: React.FC<StoryCustomizationSectionProps> = ({
    textFields,
    goalConfig,
    storyGoals,
    sectionTitle = 'تفاصيل القصة',
    form,
}) => {
    const showPredefinedGoals = goalConfig === 'predefined' || goalConfig === 'predefined_and_custom';
    const showCustomGoal = goalConfig === 'custom' || goalConfig === 'predefined_and_custom';
    
    return (
        <div className="space-y-8">
            {textFields && textFields.length > 0 && (
                <div className="p-4 bg-gray-50 rounded-lg border">
                    {/* Only show subtitle if it adds value or isn't redundant with main card title */}
                    <h4 className="text-xl font-bold text-gray-700 mb-4">{sectionTitle}</h4>
                    <DynamicTextFields fields={textFields} form={form} />
                </div>
            )}

            {goalConfig !== 'none' && (
                <div className="p-4 bg-gray-50 rounded-lg border">
                    <form.Field name="storyValue">
                        {(field: any) => {
                            const storyValue = field.state.value;
                            return (
                                <>
                                    <FormField label="الهدف من القصة*" htmlFor="storyValue" error={getFieldError(field)}>
                                        <Select
                                            id="storyValue"
                                            value={storyValue || ''}
                                            onChange={(event) => field.handleChange(event.target.value)}
                                            onBlur={field.handleBlur}
                                        >
                                            <option value="" disabled>-- اختر هدفًا --</option>
                                            {showPredefinedGoals && storyGoals.map(goal => (
                                                <option key={goal.key} value={goal.key}>{goal.title}</option>
                                            ))}
                                            {showCustomGoal && <option value="custom">هدف آخر (مخصص)</option>}
                                        </Select>
                                    </FormField>

                                    {showCustomGoal && storyValue === 'custom' && (
                                        <form.Field name="customGoal">
                                            {(customGoalField: any) => (
                                                <FormField label="الهدف المخصص*" htmlFor="customGoal" error={getFieldError(customGoalField)} className="mt-4">
                                                    <Textarea
                                                        id="customGoal"
                                                        value={customGoalField.state.value || ''}
                                                        onChange={(event) => customGoalField.handleChange(event.target.value)}
                                                        onBlur={customGoalField.handleBlur}
                                                        rows={3}
                                                        placeholder="اكتب الهدف الذي تريد التركيز عليه في القصة..."
                                                    />
                                                </FormField>
                                            )}
                                        </form.Field>
                                    )}
                                </>
                            );
                        }}
                    </form.Field>
                </div>
            )}
        </div>
    );
};

export default StoryCustomizationSection;
