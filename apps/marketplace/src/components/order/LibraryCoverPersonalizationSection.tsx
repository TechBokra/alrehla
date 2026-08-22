"use client";

import React from 'react';
import { Image as ImageIcon, PenLine } from 'lucide-react';
import type { ImageSlotConfig, TextFieldConfig } from '../../lib/database.types';
import type { OrderFormApi } from './form-types';
import DynamicTextFields from './DynamicTextFields';
import ImageUploadSection from './ImageUploadSection';

interface LibraryCoverPersonalizationSectionProps {
  form: OrderFormApi;
  textFields: TextFieldConfig[] | null;
  imageSlots: ImageSlotConfig[] | null;
}

const LibraryCoverPersonalizationSection: React.FC<LibraryCoverPersonalizationSectionProps> = ({ form, textFields, imageSlots }) => (
  <div className="space-y-8">
    <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
      <h3 className="flex items-center gap-2 text-xl font-bold text-blue-900">
        <ImageIcon size={20} /> تخصيص الغلاف فقط
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-blue-800">
        هذه قصة جاهزة. يمكنك تخصيص الغلاف والخيارات المدعومة لهذا الكتاب، بينما يبقى محتوى القصة الأصلي كما هو.
      </p>
    </div>

    {textFields && textFields.length > 0 && (
      <div className="rounded-lg border bg-gray-50 p-4">
        <h4 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-700">
          <PenLine size={19} /> بيانات الغلاف
        </h4>
        <DynamicTextFields fields={textFields} form={form} />
      </div>
    )}

    <ImageUploadSection
      form={form}
      imageSlots={imageSlots}
      title="صور الغلاف"
      description="تُستخدم الصور هنا لتخصيص الغلاف فقط، ولا تغيّر محتوى القصة."
    />
  </div>
);

export default LibraryCoverPersonalizationSection;
