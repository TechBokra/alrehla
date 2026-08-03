"use client";


import React from 'react';
import ImageUpload from '../shared/ImageUpload';
import type { ImageSlotConfig } from '../../lib/database.types';
import type { OrderFormApi } from './form-types';
import { getFieldError } from './form-types';

interface ImageUploadSectionProps {
    imageSlots: ImageSlotConfig[] | null;
    form: OrderFormApi;
}

const ImageUploadSection: React.FC<ImageUploadSectionProps> = ({ imageSlots, form }) => {

    if (!imageSlots || imageSlots.length === 0) {
        return null;
    }

    return (
        <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-6">صور التخصيص (للطفل)</h3>
            <form.Subscribe selector={(state: any) => state.fieldMeta}>
                {(fieldMeta: any) => Object.keys(fieldMeta).some(key => imageSlots.some(slot => slot.id === key && fieldMeta[key]?.errors?.length > 0)) && (
                    <div className="text-red-600 text-sm mb-4 bg-red-50 p-3 rounded-lg">يرجى رفع الصور المطلوبة.</div>
                )}
            </form.Subscribe>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {imageSlots.map(slot => (
                    <div key={slot.id}>
                        <form.Field name={slot.id}>
                            {(field: any) => (
                                <>
                                    <ImageUpload id={slot.id} label={slot.label} onFileChange={(_, file) => field.handleChange(file)} file={field.state.value} />
                                    {getFieldError(field) && <p className="text-red-500 text-xs mt-1">{getFieldError(field)}</p>}
                                </>
                            )}
                        </form.Field>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ImageUploadSection;
