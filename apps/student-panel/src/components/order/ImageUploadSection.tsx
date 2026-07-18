"use client";


import React from 'react';
import ImageUpload from '../shared/ImageUpload';
import type { ImageSlotConfig } from '../../lib/database.types';
import { useFormContext, Controller } from 'react-hook-form';

interface ImageUploadSectionProps {
    imageSlots: ImageSlotConfig[] | null;
}

const ImageUploadSection: React.FC<ImageUploadSectionProps> = ({ imageSlots }) => {
    const { control, formState: { errors } } = useFormContext();

    if (!imageSlots || imageSlots.length === 0) {
        return null;
    }

    return (
        <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-6">صور التخصيص (للطفل)</h3>
            {Object.keys(errors).filter(key => imageSlots.some(slot => slot.id === key)).length > 0 && (
                 <div className="text-red-600 text-sm mb-4 bg-red-50 p-3 rounded-lg">
                    يرجى رفع الصور المطلوبة.
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {imageSlots.map(slot => (
                    <div key={slot.id}>
                        <Controller
                            name={slot.id}
                            control={control}
                            render={({ field: { onChange, value } }) => (
                                <ImageUpload 
                                    id={slot.id} 
                                    label={slot.label} 
                                    onFileChange={(_, file) => onChange(file)} 
                                    file={value} 
                                />
                            )}
                        />
                        {errors[slot.id] && <p className="text-red-500 text-xs mt-1">{(errors[slot.id] as any).message}</p>}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ImageUploadSection;
