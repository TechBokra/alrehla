"use client";


import React, { useState, useEffect } from 'react';
import FormField from '@alrehla/ui/form-field';
import { Input } from '@alrehla/ui/input';
import { Select } from '@alrehla/ui/native-select';
import type { ChildProfile, UserProfile } from '../../lib/database.types';
import { UserPlus, User as UserIcon } from 'lucide-react';
import { Button } from '@alrehla/ui/button';
import Image from '@alrehla/ui/next-image';
import type { OrderFormApi } from './form-types';
import { getFieldError } from './form-types';

interface ChildDetailsSectionProps {
    childProfiles: ChildProfile[];
    onSelectChild: (child: ChildProfile | null) => void;
    selectedChildId: number | null;
    onSelectSelf?: () => void;
    currentUser: UserProfile | null;
    onAddChild: () => void;
    form?: OrderFormApi;
    // Optional props for non-Context usage (like SubscriptionPage)
    formData?: any;
    handleChange?: (e: React.ChangeEvent<any>) => void;
    errors?: any;
}

const ChildDetailsSection: React.FC<ChildDetailsSectionProps> = ({ 
    childProfiles, 
    onSelectChild, 
    selectedChildId, 
    onSelectSelf,
    onAddChild,
    form,
    formData,
    handleChange,
    errors: propErrors
}) => {
    const errors = propErrors || {};
    
    const today = new Date().toISOString().split('T')[0];
    
    type SelectionMode = 'profile' | 'self' | 'manual';
    const [mode, setMode] = useState<SelectionMode>(() => {
        if (selectedChildId) return 'profile';
        if (childProfiles.length > 0) return 'profile';
        return 'manual';
    });

    useEffect(() => {
        if (mode === 'profile' && childProfiles.length > 0 && !selectedChildId) {
            // Auto-select first child if in profile mode and nothing selected
            // But only if we haven't selected "manual" explicitly
             // onSelectChild(childProfiles[0]); // Commented out to prevent auto-select override
        }
    }, [mode, childProfiles, selectedChildId, onSelectChild]);

    const handleProfileSelect = (child: ChildProfile) => {
        setMode('profile');
        onSelectChild(child);
    }

    const handleSelfSelect = () => {
        setMode('self');
        if (onSelectSelf) onSelectSelf();
    }

    const handleManualSelect = () => {
        setMode('manual');
        onSelectChild(null);
    }
    
    const getError = (fieldName: string) => errors[fieldName]?.message || errors[fieldName];
    
    const hasMultipleOptions = childProfiles.length > 0;

    return (
        <div>
            {hasMultipleOptions && (
                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    {childProfiles.map(child => (
                        <button 
                            type="button"
                            key={child.id} 
                            onClick={() => handleProfileSelect(child)} 
                            className={`p-4 border-2 rounded-2xl text-center transition-all flex flex-col items-center gap-2 hover:shadow-md hover:border-blue-400 ${mode === 'profile' && selectedChildId === child.id ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 bg-white'}`}
                        >
                            <Image src={child.avatar_url || '/images/male-avatar.png'} alt={child.name} className="w-16 h-16 rounded-full border border-gray-100"/>
                            <span className="font-bold text-gray-800 text-sm">{child.name}</span>
                        </button>
                    ))}
                     {onSelectSelf && (
                         <button 
                            type="button"
                            onClick={handleSelfSelect} 
                            className={`p-4 border-2 rounded-2xl text-center transition-all flex flex-col items-center justify-center gap-2 hover:shadow-md hover:border-blue-400 ${mode === 'self' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}
                        >
                            <UserIcon className="w-10 h-10 text-gray-400"/>
                            <span className="font-bold text-gray-800 text-sm">لي شخصيًا</span>
                         </button>
                     )}
                     <button 
                        type="button"
                        onClick={handleManualSelect} 
                        className={`p-4 border-2 rounded-2xl text-center transition-all flex flex-col items-center justify-center gap-2 hover:shadow-md hover:border-blue-400 ${mode === 'manual' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}
                    >
                        <UserPlus className="w-10 h-10 text-gray-400"/>
                        <span className="font-bold text-gray-800 text-sm">طفل آخر / هدية</span>
                     </button>
                </div>
            )}

            <div className="p-4 bg-gray-50 rounded-lg border grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                <div className="md:col-span-2">
                    <p className="text-sm text-gray-500 mb-2">
                        {mode === 'profile' 
                            ? 'تم ملء البيانات تلقائياً بناءً على الملف المختار.' 
                            : 'يرجى إدخال بيانات الطفل يدوياً.'}
                    </p>
                </div>
                <FormField label="الاسم*" htmlFor="childName" error={form ? undefined : getError('childName')}>
                    {form ? (
                        <form.Field name="childName">
                            {(field: any) => (<>
                                <Input
                                    id="childName"
                                    type="text"
                                    value={field.state.value || ''}
                                    onChange={(event) => field.handleChange(event.target.value)}
                                    onBlur={field.handleBlur}
                                    disabled={mode === 'self'}
                                />
                                {getFieldError(field) && <p className="text-sm font-medium text-destructive">{getFieldError(field)}</p>}
                            </>)}
                        </form.Field>
                    ) : (
                        <Input
                            id="childName"
                            type="text"
                            name="childName"
                            value={formData?.childName || ''}
                            onChange={handleChange}
                            disabled={mode === 'self'}
                        />
                    )}
                </FormField>
                <FormField label="تاريخ الميلاد*" htmlFor="childBirthDate" error={form ? undefined : getError('childBirthDate')}>
                    {form ? (
                        <form.Field name="childBirthDate">
                            {(field: any) => (<>
                                <Input
                                    id="childBirthDate"
                                    type="date"
                                    max={today}
                                    value={field.state.value || ''}
                                    onChange={(event) => field.handleChange(event.target.value)}
                                    onBlur={field.handleBlur}
                                />
                                {getFieldError(field) && <p className="text-sm font-medium text-destructive">{getFieldError(field)}</p>}
                            </>)}
                        </form.Field>
                    ) : (
                        <Input
                            id="childBirthDate"
                            type="date"
                            name="childBirthDate"
                            max={today}
                            value={formData?.childBirthDate || ''}
                            onChange={handleChange}
                        />
                    )}
                </FormField>
                <FormField label="الجنس*" htmlFor="childGender" className="md:col-span-2" error={form ? undefined : getError('childGender')}>
                    {form ? (
                        <form.Field name="childGender">
                            {(field: any) => (<>
                                <Select
                                    id="childGender"
                                    value={field.state.value || ''}
                                    onChange={(event) => field.handleChange(event.target.value)}
                                    onBlur={field.handleBlur}
                                >
                                    <option value="" disabled>-- اختر الجنس --</option>
                                    <option value="ذكر">ذكر</option>
                                    <option value="أنثى">أنثى</option>
                                </Select>
                                {getFieldError(field) && <p className="text-sm font-medium text-destructive">{getFieldError(field)}</p>}
                            </>)}
                        </form.Field>
                    ) : (
                        <Select
                            id="childGender"
                            name="childGender"
                            value={formData?.childGender || ''}
                            onChange={handleChange}
                        >
                            <option value="" disabled>-- اختر الجنس --</option>
                            <option value="ذكر">ذكر</option>
                            <option value="أنثى">أنثى</option>
                        </Select>
                    )}
                </FormField>
            </div>

             <div className="mt-6 text-center">
                <Button type="button" variant="link" onClick={onAddChild} icon={<UserPlus size={16}/>}>
                    إضافة طفل جديد للملف العائلي
                </Button>
            </div>
        </div>
    );
};

export default ChildDetailsSection;
