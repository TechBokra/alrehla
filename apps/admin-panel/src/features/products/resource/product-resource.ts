'use client';

import { defineResource, normalizeResourceList } from '@eng-mohamedelsayed/admin-core/resource';
import {
  getPersonalizedProducts,
  createPersonalizedProductAction,
  updatePersonalizedProductAction,
  deletePersonalizedProductAction,
} from '@/actions/products';
import type { PersonalizedProduct } from '@alrehla/types';
import { productColumns } from '../columns/product-columns';
import { ProductFormDialog } from '../components/product-form-dialog';
import type { ProductFormValues } from '../validation/product-schema';

export const productListQueryKey = () => ['admin', 'personalizedProducts'] as const;

export const productListQuery = async () => {
  return getPersonalizedProducts();
};

export const productResource = defineResource<
  PersonalizedProduct,
  ProductFormValues,
  ProductFormValues,
  PersonalizedProduct[],
  unknown,
  Record<string, string>,
  number
>({
  scope: 'global',
  metadata: {
    name: 'products',
    label: 'المنتجات المخصصة',
    singularLabel: 'منتج',
    pluralLabel: 'المنتجات',
    description: 'إدارة وتخصيص قصص الأطفال وكتب المكتبة والإضافات وصناديق الاشتراكات.',
  },
  capabilities: {
    create: true,
    update: true,
    delete: true,
    import: false,
    export: false,
    selection: false,
    bulkActions: false,
  },
  authorization: {
    read: 'canManageEnhaLakProducts',
    create: 'canManageEnhaLakProducts',
    update: 'canManageEnhaLakProducts',
    delete: 'canManageEnhaLakProducts',
  },
  query: {
    queryKey: () => productListQueryKey(),
    queryFn: () => productListQuery(),
    normalize: (rows) => normalizeResourceList(rows, rows.length),
  },
  mutations: {
    create: {
      mutationKey: ['admin', 'mutations', 'products', 'create'],
      mutationFn: async (values: ProductFormValues) => {
        return createPersonalizedProductAction(values);
      },
      invalidate: [['admin', 'personalizedProducts']],
      successMessage: 'تم إضافة المنتج بنجاح.',
      errorMessage: 'فشل إضافة المنتج.',
    },
    update: {
      mutationKey: ['admin', 'mutations', 'products', 'update'],
      mutationFn: async ({
        record,
        values,
      }: {
        record: PersonalizedProduct;
        values: ProductFormValues;
      }) => {
        return updatePersonalizedProductAction({ ...values, id: record.id });
      },
      getInput: (record, values) => ({ record, values }),
      invalidate: [['admin', 'personalizedProducts']],
      successMessage: 'تم تحديث بيانات المنتج بنجاح.',
      errorMessage: 'فشل تحديث المنتج.',
    },
    delete: {
      mutationKey: ['admin', 'mutations', 'products', 'delete'],
      mutationFn: async (productId: number) => {
        await deletePersonalizedProductAction(productId);
      },
      getInput: (product) => product.id,
      getLabel: (product) => `المنتج "${product.title}"`,
      invalidate: [['admin', 'personalizedProducts']],
      successMessage: 'تم حذف المنتج بنجاح.',
      errorMessage: 'فشل حذف المنتج.',
    },
  },
  forms: {
    create: {
      mode: 'dialog',
      component: ProductFormDialog,
      title: 'إضافة منتج جديد',
      description: 'أدخل تفاصيل وبيانات المنتج المخصص الجديد.',
    },
    update: {
      mode: 'dialog',
      component: ProductFormDialog,
      title: ({ record }) => `تعديل المنتج: ${record?.title ?? ''}`,
      description: 'تعديل بيانات المنتج وأسعاره وحالته.',
    },
  },
  dataView: {
    columns: productColumns,
    getRowId: (product) => String(product.id),
    search: {
      placeholder: 'ابحث عن منتج بالاسم أو المعرف...',
      ariaLabel: 'بحث في المنتجات',
    },
  },
});
