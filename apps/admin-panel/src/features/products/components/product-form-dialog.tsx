'use client';

import * as React from 'react';
import { useAppForm, zodFormOptions, FormSubmitButton } from '@alrehla/forms';
import { FormDialog } from '@alrehla/ui/components/forms';
import { Button } from '@alrehla/ui/button';
import type { PersonalizedProduct } from '@alrehla/types';
import {
  productSchema,
  defaultProductFormValues,
  type ProductFormValues,
} from '../validation/product-schema';

export interface ProductFormDialogProps {
  mode: 'create' | 'update';
  record?: PersonalizedProduct | undefined;
  open?: boolean;
  title?: string;
  description?: string;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  onSubmit: (values: ProductFormValues) => Promise<unknown> | void;
  isPending?: boolean;
}

export function ProductFormDialog({
  mode,
  record,
  open = true,
  title,
  description,
  onOpenChange,
  onClose,
  onSubmit,
  isPending = false,
}: ProductFormDialogProps) {
  const defaultValues = React.useMemo<ProductFormValues>(() => {
    if (!record) return defaultProductFormValues;
    return {
      title: record.title || '',
      key: record.key || '',
      product_type: (record.product_type as ProductFormValues['product_type']) || 'hero_story',
      description: record.description || '',
      image_url: record.image_url || '',
      price_printed: record.price_printed ?? 0,
      price_electronic: record.price_electronic ?? 0,
      has_printed_version: record.has_printed_version ?? true,
      sort_order: record.sort_order ?? 0,
      is_active: record.is_active ?? true,
      is_featured: record.is_featured ?? false,
      is_addon: record.is_addon ?? false,
    };
  }, [record]);

  const form = useAppForm({
    ...zodFormOptions(productSchema),
    defaultValues,
    onSubmit: async ({ value }) => {
      await onSubmit(value);
      onClose?.();
    },
  });

  return (
    <form.AppForm>
      <FormDialog
        open={open}
        onOpenChange={onOpenChange}
        title={title || (mode === 'create' ? 'إضافة منتج جديد' : `تعديل منتج: ${record?.title || ''}`)}
        description={description || 'أدخل بيانات وتفاصيل المنتج المخصص'}
        maxWidth="xl"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              إلغاء
            </Button>
            <FormSubmitButton form="product-dialog-form" pending={isPending}>
              {mode === 'create' ? 'إضافة المنتج' : 'حفظ التعديلات'}
            </FormSubmitButton>
          </div>
        }
      >
        <form
          id="product-dialog-form"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void form.handleSubmit();
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <form.AppField name="title">
              {(field) => (
                <field.TextField
                  label="اسم المنتج"
                  placeholder="مثال: قصة بطل الفضاء"
                  required
                />
              )}
            </form.AppField>

            <form.AppField name="key">
              {(field) => (
                <field.TextField
                  label="المعرف الفريد (Slug)"
                  placeholder="hero_space_story"
                  required
                />
              )}
            </form.AppField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <form.AppField name="product_type">
              {(field) => (
                <field.SelectField label="نوع المنتج" required>
                  <option value="hero_story">قصة بطل (تخصيص كامل)</option>
                  <option value="library_book">كتاب مكتبة (غلاف فقط)</option>
                  <option value="addon">منتج إضافي (Addon)</option>
                  <option value="subscription_box">صندوق اشتراك</option>
                </field.SelectField>
              )}
            </form.AppField>

            <form.AppField name="sort_order">
              {(field) => (
                <field.NumberField
                  label="الترتيب في العرض"
                  placeholder="0"
                />
              )}
            </form.AppField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <form.AppField name="price_printed">
              {(field) => (
                <field.NumberField
                  label="سعر النسخة المطبوعة (ج.م)"
                  min={0}
                  step="0.01"
                  placeholder="0.00"
                />
              )}
            </form.AppField>

            <form.AppField name="price_electronic">
              {(field) => (
                <field.NumberField
                  label="سعر النسخة الإلكترونية (ج.م)"
                  min={0}
                  step="0.01"
                  placeholder="0.00"
                />
              )}
            </form.AppField>
          </div>

          <form.AppField name="image_url">
            {(field) => (
              <field.TextField
                label="رابط صورة الغلاف"
                placeholder="https://..."
              />
            )}
          </form.AppField>

          <form.AppField name="description">
            {(field) => (
              <field.TextareaField
                label="وصف المنتج"
                placeholder="أدخل وصفاً تفصيلياً لمحتوى ومميزات المنتج..."
                rows={3}
              />
            )}
          </form.AppField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
            <form.AppField name="is_active">
              {(field) => (
                <field.SwitchField
                  label="المنتج نشط"
                  description="متاح للعرض والشراء على المنصة"
                />
              )}
            </form.AppField>

            <form.AppField name="has_printed_version">
              {(field) => (
                <field.SwitchField
                  label="نسخة مطبوعة"
                  description="تتوفر منه نسخة مطبوعة للشحن"
                />
              )}
            </form.AppField>

            <form.AppField name="is_featured">
              {(field) => (
                <field.SwitchField
                  label="منتج مميز"
                  description="يظهر في الصفحة الرئيسية والأقسام المميزة"
                />
              )}
            </form.AppField>

            <form.AppField name="is_addon">
              {(field) => (
                <field.SwitchField
                  label="منتج إضافي (Addon)"
                  description="يظهر كاقتراح إضافي في سلة الشراء"
                />
              )}
            </form.AppField>
          </div>
        </form>
      </FormDialog>
    </form.AppForm>
  );
}

export default ProductFormDialog;
