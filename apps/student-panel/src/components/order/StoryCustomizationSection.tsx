"use client";


import React from 'react';
import FormField from '@alrehla/ui/form-field';
import { Select } from '@alrehla/ui/native-select';
import { Textarea } from '@alrehla/ui/textarea';
import type { TextFieldConfig, StoryGoal, GoalConfig } from '../../lib/database.types';
import DynamicTextFields from './DynamicTextFields';
import { useFormContext } from 'react-hook-form';

interface StoryCustomizationSectionProps {
    textFields: TextFieldConfig[] | null;
    goalConfig: GoalConfig;
    storyGoals: StoryGoal[];
    sectionTitle?: string;
}

const StoryCustomizationSection: React.FC<StoryCustomizationSectionProps> = ({
    textFields,
    goalConfig,
    storyGoals,
    sectionTitle = 'تفاصيل القصة'
}) => {
    const { register, formState: { errors }, watch } = useFormContext();
    const storyValue = watch('storyValue');

    const showPredefinedGoals = goalConfig === 'predefined' || goalConfig === 'predefined_and_custom';
    const showCustomGoal = goalConfig === 'custom' || goalConfig === 'predefined_and_custom';
    
    return (
        <div className="space-y-8">
            {textFields && textFields.length > 0 && (
                <div className="p-4 bg-gray-50 rounded-lg border">
                    {/* Only show subtitle if it adds value or isn't redundant with main card title */}
                    <h4 className="text-xl font-bold text-gray-700 mb-4">{sectionTitle}</h4>
                    <DynamicTextFields fields={textFields} />
                </div>
            )}

            {goalConfig !== 'none' && (
                <div className="p-4 bg-gray-50 rounded-lg border">
                    <FormField label="الهدف من القصة*" htmlFor="storyValue" error={errors.storyValue?.message as string}>
                        <Select id="storyValue" {...register('storyValue')}>
                            <option value="" disabled>-- اختر هدفًا --</option>
                            {showPredefinedGoals && storyGoals.map(goal => (
                                <option key={goal.key} value={goal.key}>{goal.title}</option>
                            ))}
                            {showCustomGoal && <option value="custom">هدف آخر (مخصص)</option>}
                        </Select>
                    </FormField>

                    {showCustomGoal && storyValue === 'custom' && (
                        <FormField label="الهدف المخصص*" htmlFor="customGoal" error={errors.customGoal?.message as string} className="mt-4">
                            <Textarea id="customGoal" {...register('customGoal')} rows={3} placeholder="اكتب الهدف الذي تريد التركيز عليه في القصة..." />
                        </FormField>
                    )}
                </div>
            )}
        </div>
    );
};

export default StoryCustomizationSection;
