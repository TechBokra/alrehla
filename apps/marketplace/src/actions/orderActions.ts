"use server";

import { orderService as apiOrderService } from '@alrehla/api/services/orderService';
import { storageService as apiStorageService } from '@alrehla/api/services/storageService';
import type { UserRole } from '@alrehla/types';
import { z } from 'zod';
import {
  checkoutFileSchema,
  checkoutUploadPathListSchema,
  checkoutUploadPurposeSchema,
  createOrderSchema,
  createSubscriptionSchema,
  idListSchema,
  listOptionsSchema,
  numericIdSchema,
  orderStatusSchema,
  personalizedProductSchema,
  receiptFileSchema,
  receiptTypeSchema,
  resourceIdSchema,
  subscriptionActionSchema,
  subscriptionPlanSchema,
} from '../lib/server/actionSchemas';
import {
  MARKETPLACE_ROLES,
  type MarketplaceActionContext,
  actionError,
  isDatabaseAdmin,
  parseActionInput,
  requireChildAccess,
  requireResourceOwner,
  revalidateMarketplaceTags,
  withMarketplaceAction,
  withPublicAction,
} from '../lib/server/actionSecurity';

const CHECKOUT_ROLES = [
  'user',
  'parent',
  'student',
  ...MARKETPLACE_ROLES.databaseAdmins,
] as const satisfies readonly UserRole[];

const RECEIPT_ROLES = [
  'user',
  'parent',
  ...MARKETPLACE_ROLES.databaseAdmins,
] as const satisfies readonly UserRole[];

const requireProductOwnership = async (
  context: MarketplaceActionContext,
  productId: number,
) => {
  const { data, error } = await context.supabase
    .from('personalized_products')
    .select('id, publisher_id')
    .eq('id', productId)
    .maybeSingle();

  const product = data as { id: number; publisher_id?: string | null } | null;
  if (error || !product) {
    actionError('المنتج غير موجود أو لا تملك صلاحية الوصول إليه.');
  }

  if (
    context.actor.role === 'publisher' &&
    product.publisher_id !== context.actor.id
  ) {
    actionError('لا تملك صلاحية إدارة هذا المنتج.');
  }

  return product;
};

export const getAllOrders = async (options?: any) => {
  const input = parseActionInput(listOptionsSchema, options || {});
  return withMarketplaceAction(
    'order.getAllOrders',
    () => apiOrderService.getAllOrders(input),
    MARKETPLACE_ROLES.orderManagers,
  );
};

export const createOrder = async (payload: any) => {
  const input = parseActionInput(createOrderSchema, payload) as {
    userId?: string;
    childId: number | null;
    summary: string;
    total: number;
    shippingCost: number;
    productKey: string;
    details: Record<string, any>;
    receiptUrl?: string;
  };
  return withMarketplaceAction(
    'order.createOrder',
    async (context) => {
      let payerUserId = context.actor.id;
      if (input.childId !== null) {
        const child = await requireChildAccess(context, input.childId, {
          allowLinkedStudent: context.actor.role === 'student',
        });
        if (context.actor.role === 'student') {
          payerUserId = child.user_id;
        }
      } else if (context.actor.role === 'student') {
        actionError('يجب اختيار ملف الطفل المرتبط بحساب الطالب.');
      }

      let result;
      try {
        result = await apiOrderService.createOrder({
          ...input,
          userId: payerUserId,
          // The secure database function, not browser arithmetic, determines totals.
          total: 0,
          shippingCost: 0,
        });
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes('Personalized add-on')
        ) {
          actionError('إحدى الإضافات غير متاحة لنوع النسخة المختار. عدّل محتوى السلة ثم حاول مرة أخرى.');
        }
        throw error;
      }
      revalidateMarketplaceTags(
        `marketplace:account:${context.actor.id}`,
        payerUserId !== context.actor.id
          ? `marketplace:account:${payerUserId}`
          : null,
        'marketplace:orders',
      );
      return result;
    },
    CHECKOUT_ROLES,
  );
};

export const createSubscription = async (payload: any) => {
  const input = parseActionInput(createSubscriptionSchema, payload);
  return withMarketplaceAction(
    'order.createSubscription',
    async (context) => {
      const child = await requireChildAccess(context, input.childId, {
        allowLinkedStudent: context.actor.role === 'student',
      });
      const payerUserId =
        context.actor.role === 'student' ? child.user_id : context.actor.id;

      const { data: plan, error } = await context.supabase
        .from('subscription_plans')
        .select('name, duration_months')
        .eq('name', input.planName)
        .eq('is_active', true)
        .is('deleted_at', null)
        .maybeSingle();

      if (error || !plan) {
        actionError('خطة الاشتراك غير موجودة أو غير متاحة.');
      }

      const result = await apiOrderService.createSubscription({
        userId: payerUserId,
        childId: input.childId,
        planName: (plan as any).name,
        durationMonths: Number((plan as any).duration_months),
      });
      revalidateMarketplaceTags(
        `marketplace:account:${context.actor.id}`,
        payerUserId !== context.actor.id
          ? `marketplace:account:${payerUserId}`
          : null,
        'marketplace:subscriptions',
      );
      return result;
    },
    CHECKOUT_ROLES,
  );
};

export const getAllSubscriptions = async () =>
  withMarketplaceAction(
    'order.getAllSubscriptions',
    () => apiOrderService.getAllSubscriptions(),
    MARKETPLACE_ROLES.databaseAdmins,
  );

export const getSubscriptionPlans = async () =>
  withPublicAction('order.getSubscriptionPlans', () =>
    apiOrderService.getSubscriptionPlans(),
  );

export const updateSubscriptionStatus = async (
  subscriptionId: string,
  action: 'pause' | 'reactivate' | 'cancel',
) => {
  const id = parseActionInput(resourceIdSchema, subscriptionId);
  const requestedAction = parseActionInput(subscriptionActionSchema, action);

  return withMarketplaceAction(
    'order.updateSubscriptionStatus',
    async (context) => {
      await requireResourceOwner(context, 'subscriptions', id);

      const { data, error } = await context.supabase
        .from('subscriptions')
        .select('status')
        .eq('id', id)
        .maybeSingle();

      const currentStatus = (data as { status?: string } | null)?.status;
      if (error || !currentStatus) {
        actionError('تعذر التحقق من حالة الاشتراك.');
      }

      if (!isDatabaseAdmin(context.actor)) {
        const allowed =
          (requestedAction === 'pause' && currentStatus === 'active') ||
          (requestedAction === 'reactivate' && currentStatus === 'paused') ||
          (requestedAction === 'cancel' &&
            ['active', 'paused', 'pending_payment', 'pending_review'].includes(
              currentStatus,
            ));

        if (!allowed) {
          actionError('لا يمكن تنفيذ هذا الانتقال على حالة الاشتراك الحالية.');
        }
      }

      const result = await apiOrderService.updateSubscriptionStatus(
        id,
        requestedAction,
      );
      revalidateMarketplaceTags(
        `marketplace:account:${context.actor.id}`,
        'marketplace:subscriptions',
      );
      return result;
    },
    RECEIPT_ROLES,
  );
};

export const updateOrderStatus = async (orderId: string, newStatus: any) => {
  const id = parseActionInput(resourceIdSchema, orderId);
  const status = parseActionInput(orderStatusSchema, newStatus);
  return withMarketplaceAction(
    'order.updateOrderStatus',
    async () => {
      const result = await apiOrderService.updateOrderStatus(id, status);
      revalidateMarketplaceTags(`marketplace:order:${id}`, 'marketplace:orders');
      return result;
    },
    MARKETPLACE_ROLES.orderManagers,
  );
};

export const updateServiceOrderStatus = async (
  orderId: string,
  newStatus: any,
) => {
  const id = parseActionInput(resourceIdSchema, orderId);
  const status = parseActionInput(orderStatusSchema, newStatus);
  return withMarketplaceAction(
    'order.updateServiceOrderStatus',
    async () => {
      const result = await apiOrderService.updateServiceOrderStatus(id, status);
      revalidateMarketplaceTags(
        `marketplace:service-order:${id}`,
        'marketplace:service-orders',
      );
      return result;
    },
    MARKETPLACE_ROLES.orderManagers,
  );
};

export const assignInstructorToServiceOrder = async (
  orderId: string,
  instructorId: number | null,
) => {
  const id = parseActionInput(resourceIdSchema, orderId);
  const instructor = parseActionInput(numericIdSchema.nullable(), instructorId);
  return withMarketplaceAction(
    'order.assignInstructorToServiceOrder',
    async (context) => {
      if (instructor !== null) {
        const { data, error } = await context.supabase
          .from('instructors')
          .select('id')
          .eq('id', instructor)
          .is('deleted_at', null)
          .maybeSingle();
        if (error || !data) {
          actionError('المدرب المحدد غير موجود أو غير متاح.');
        }
      }

      const result = await apiOrderService.assignInstructorToServiceOrder(
        id,
        instructor,
      );
      revalidateMarketplaceTags(
        `marketplace:service-order:${id}`,
        'marketplace:service-orders',
      );
      return result;
    },
    MARKETPLACE_ROLES.orderManagers,
  );
};

export const updateOrderComment = async (orderId: string, comment: string) => {
  const id = parseActionInput(resourceIdSchema, orderId);
  const safeComment = parseActionInput(z.string().trim().max(5000), comment);
  return withMarketplaceAction(
    'order.updateOrderComment',
    async () => {
      const result = await apiOrderService.updateOrderComment(id, safeComment);
      revalidateMarketplaceTags(`marketplace:order:${id}`);
      return result;
    },
    MARKETPLACE_ROLES.orderManagers,
  );
};

export const uploadReceipt = async (
  itemId: string,
  itemType: 'order' | 'booking' | 'subscription',
  receiptFile: File,
) => {
  const id = parseActionInput(resourceIdSchema, itemId);
  const type = parseActionInput(receiptTypeSchema, itemType);
  const file = parseActionInput(receiptFileSchema, receiptFile);

  return withMarketplaceAction(
    'order.uploadReceipt',
    async (context) => {
      const table =
        type === 'booking'
          ? 'bookings'
          : type === 'subscription'
            ? 'subscriptions'
            : 'orders';
      await requireResourceOwner(context, table, id);

      const result = await apiOrderService.uploadReceipt(id, type, file);
      revalidateMarketplaceTags(
        `marketplace:account:${context.actor.id}`,
        `marketplace:${type}:${id}`,
      );
      return result;
    },
    RECEIPT_ROLES,
  );
};

export const uploadCheckoutFile = async (
  purpose: 'payment_receipt' | 'service_attachment' | 'custom_image',
  checkoutFile: File,
) => {
  const safePurpose = parseActionInput(checkoutUploadPurposeSchema, purpose);
  const file = parseActionInput(checkoutFileSchema, checkoutFile);

  if (
    safePurpose === 'custom_image' &&
    !['image/png', 'image/jpeg'].includes(file.type)
  ) {
    actionError('صور التخصيص يجب أن تكون بصيغة PNG أو JPG.');
  }

  const folderByPurpose = {
    payment_receipt: 'checkout/payment_receipts',
    service_attachment: 'checkout/service_attachments',
    custom_image: 'checkout/custom_images',
  } as const;

  return withMarketplaceAction(
    'order.uploadCheckoutFile',
    () =>
      apiStorageService.uploadFileWithPath(
        file,
        'receipts',
        folderByPurpose[safePurpose],
      ),
    CHECKOUT_ROLES,
  );
};

export const cleanupCheckoutFiles = async (checkoutPaths: string[]) => {
  const paths = parseActionInput(checkoutUploadPathListSchema, checkoutPaths);

  return withMarketplaceAction(
    'order.cleanupCheckoutFiles',
    async (context) => {
      const allowedPrefix = `${context.actor.id}/checkout/`;
      const allowedFolders = new Set([
        'payment_receipts',
        'service_attachments',
        'custom_images',
      ]);

      const allPathsAreOwnedCheckoutFiles = paths.every((path) => {
        if (!path.startsWith(allowedPrefix)) return false;
        const relativePath = path.slice(allowedPrefix.length);
        const [folder, fileName, extraSegment] = relativePath.split('/');
        return (
          !extraSegment &&
          allowedFolders.has(folder) &&
          /^[0-9a-f-]{36}\.(?:jpg|png|pdf)$/i.test(fileName || '')
        );
      });

      if (!allPathsAreOwnedCheckoutFiles) {
        actionError('مسار ملف التنظيف غير صالح.');
      }

      await apiStorageService.removeFiles('receipts', paths);
      return { success: true };
    },
    CHECKOUT_ROLES,
  );
};

export const bulkUpdateOrderStatus = async (
  orderIds: string[],
  status: any,
) => {
  const ids = parseActionInput(idListSchema, orderIds);
  const nextStatus = parseActionInput(orderStatusSchema, status);
  return withMarketplaceAction(
    'order.bulkUpdateOrderStatus',
    async () => {
      const result = await apiOrderService.bulkUpdateOrderStatus(ids, nextStatus);
      revalidateMarketplaceTags('marketplace:orders');
      return result;
    },
    MARKETPLACE_ROLES.orderManagers,
  );
};

export const bulkDeleteOrders = async (orderIds: string[]) => {
  const ids = parseActionInput(idListSchema, orderIds);
  return withMarketplaceAction(
    'order.bulkDeleteOrders',
    async () => {
      const result = await apiOrderService.bulkDeleteOrders(ids);
      revalidateMarketplaceTags('marketplace:orders');
      return result;
    },
    MARKETPLACE_ROLES.databaseAdmins,
  );
};

export const createSubscriptionPlan = async (plan: any) => {
  const input = parseActionInput(subscriptionPlanSchema, plan);
  return withMarketplaceAction(
    'order.createSubscriptionPlan',
    async () => {
      const { id: _ignoredId, ...newPlan } = input;
      const result = await apiOrderService.createSubscriptionPlan(newPlan);
      revalidateMarketplaceTags('marketplace:subscription-plans');
      return result;
    },
    MARKETPLACE_ROLES.databaseAdmins,
  );
};

export const updateSubscriptionPlan = async (plan: any) => {
  const input = parseActionInput(subscriptionPlanSchema, plan);
  if (!input.id) actionError('معرف خطة الاشتراك مطلوب.');

  return withMarketplaceAction(
    'order.updateSubscriptionPlan',
    async () => {
      const result = await apiOrderService.updateSubscriptionPlan({
        ...input,
        id: input.id!,
      });
      revalidateMarketplaceTags('marketplace:subscription-plans');
      return result;
    },
    MARKETPLACE_ROLES.databaseAdmins,
  );
};

export const deleteSubscriptionPlan = async (planId: number) => {
  const id = parseActionInput(numericIdSchema, planId);
  return withMarketplaceAction(
    'order.deleteSubscriptionPlan',
    async () => {
      const result = await apiOrderService.deleteSubscriptionPlan(id);
      revalidateMarketplaceTags('marketplace:subscription-plans');
      return result;
    },
    MARKETPLACE_ROLES.databaseAdmins,
  );
};

export const getPersonalizedProducts = async () =>
  withPublicAction('order.getPersonalizedProducts', () =>
    apiOrderService.getPersonalizedProducts(),
  );

export const createPersonalizedProduct = async (product: any) => {
  const input = parseActionInput(personalizedProductSchema, product);
  return withMarketplaceAction(
    'order.createPersonalizedProduct',
    async (context) => {
      const { id: _ignoredId, ...newProduct } = input;
      const publisherFields =
        context.actor.role === 'publisher'
          ? {
              publisher_id: context.actor.id,
              approval_status: 'pending' as const,
              is_active: false,
            }
          : {};
      const result = await apiOrderService.createPersonalizedProduct({
        ...newProduct,
        ...publisherFields,
      } as any);
      revalidateMarketplaceTags('marketplace:products');
      return result;
    },
    MARKETPLACE_ROLES.productAuthors,
  );
};

export const updatePersonalizedProduct = async (product: any) => {
  const input = parseActionInput(personalizedProductSchema, product);
  if (!input.id) actionError('معرف المنتج مطلوب.');

  return withMarketplaceAction(
    'order.updatePersonalizedProduct',
    async (context) => {
      await requireProductOwnership(context, input.id!);
      const publisherFields =
        context.actor.role === 'publisher'
          ? {
              publisher_id: context.actor.id,
              approval_status: 'pending' as const,
              is_active: false,
            }
          : {};
      const result = await apiOrderService.updatePersonalizedProduct({
        ...input,
        id: input.id!,
        ...publisherFields,
      } as any);
      revalidateMarketplaceTags(
        `marketplace:product:${input.id}`,
        'marketplace:products',
      );
      return result;
    },
    MARKETPLACE_ROLES.productAuthors,
  );
};

export const approveProduct = async (
  productId: number,
  status: 'approved' | 'rejected',
) => {
  const id = parseActionInput(numericIdSchema, productId);
  const approvalStatus = parseActionInput(
    z.enum(['approved', 'rejected']),
    status,
  );
  return withMarketplaceAction(
    'order.approveProduct',
    async () => {
      const result = await apiOrderService.approveProduct(id, approvalStatus);
      revalidateMarketplaceTags(
        `marketplace:product:${id}`,
        'marketplace:products',
      );
      return result;
    },
    MARKETPLACE_ROLES.productManagers,
  );
};

export const deletePersonalizedProduct = async (productId: number) => {
  const id = parseActionInput(numericIdSchema, productId);
  return withMarketplaceAction(
    'order.deletePersonalizedProduct',
    async (context) => {
      await requireProductOwnership(context, id);
      const result = await apiOrderService.deletePersonalizedProduct(id);
      revalidateMarketplaceTags('marketplace:products');
      return result;
    },
    MARKETPLACE_ROLES.productAuthors,
  );
};

export const getAllServiceOrders = async () =>
  withMarketplaceAction(
    'order.getAllServiceOrders',
    () => apiOrderService.getAllServiceOrders(),
    MARKETPLACE_ROLES.orderManagers,
  );
