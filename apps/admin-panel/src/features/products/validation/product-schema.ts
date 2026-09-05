import { z } from 'zod';

export const productSchema = z.object({
  title: z
    .string({ required_error: 'عنوان المنتج مطلوب' })
    .min(2, 'يجب أن يكون عنوان المنتج حرفين على الأقل'),
  key: z
    .string({ required_error: 'المعرف الفريد (Slug) مطلوب' })
    .min(2, 'يجب أن يكون المعرف الفريد حرفين على الأقل')
    .regex(/^[a-zA-Z0-9_-]+$/, 'المعرف يجب أن يحتوي فقط على أحرف وأرقام و _ أو -'),
  product_type: z.enum(['hero_story', 'library_book', 'subscription_box', 'addon'], {
    required_error: 'نوع المنتج مطلوب',
  }),
  description: z.string().optional().default(''),
  image_url: z.string().optional().default(''),
  price_printed: z
    .number({ invalid_type_error: 'يجب إدخال سعر صحيح' })
    .min(0, 'السعر يجب أن يكون 0 أو أكثر')
    .default(0),
  price_electronic: z
    .number({ invalid_type_error: 'يجب إدخال سعر صحيح' })
    .min(0, 'السعر يجب أن يكون 0 أو أكثر')
    .default(0),
  has_printed_version: z.boolean().default(true),
  sort_order: z
    .number({ invalid_type_error: 'يجب إدخال رقم صحيح' })
    .int('الترتيب يجب أن يكون عدداً صحيحاً')
    .default(0),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  is_addon: z.boolean().default(false),
});

export type ProductFormValues = z.infer<typeof productSchema>;

export const defaultProductFormValues: ProductFormValues = {
  title: '',
  key: '',
  product_type: 'hero_story',
  description: '',
  image_url: '',
  price_printed: 0,
  price_electronic: 0,
  has_printed_version: true,
  sort_order: 0,
  is_active: true,
  is_featured: false,
  is_addon: false,
};
