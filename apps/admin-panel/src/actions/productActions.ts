'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { orderService } from '@alrehla/api/services/orderService';
import { runWithSupabaseAccessTokenProvider } from '@alrehla/api/lib/supabaseClient';
import type { PersonalizedProduct } from '@alrehla/types';

const withClerkSupabaseSession = async <T>(operation: () => Promise<T>) => {
  const session = await auth();

  if (!session.userId) {
    throw new Error('جلسة غير صالحة. أعد تسجيل الدخول ثم حاول مرة أخرى.');
  }

  return runWithSupabaseAccessTokenProvider(async () => {
    const token = await session.getToken();
    if (!token) {
      throw new Error('تعذر قراءة جلسة Clerk الحالية. أعد تسجيل الدخول ثم حاول مرة أخرى.');
    }

    return token;
  }, operation);
};

const revalidateProductRoutes = () => {
  revalidatePath('/personalized-products');
  revalidatePath('/publisher-products');
};

export const createPersonalizedProduct = async (product: Partial<PersonalizedProduct>) => {
  const result = await withClerkSupabaseSession(() =>
    orderService.createPersonalizedProduct(product),
  );
  revalidateProductRoutes();
  return result;
};

export const updatePersonalizedProduct = async (
  product: Partial<PersonalizedProduct> & { id: number },
) => {
  const result = await withClerkSupabaseSession(() =>
    orderService.updatePersonalizedProduct(product),
  );
  revalidateProductRoutes();
  return result;
};

export const deletePersonalizedProduct = async (productId: number) => {
  const result = await withClerkSupabaseSession(() =>
    orderService.deletePersonalizedProduct(productId),
  );
  revalidateProductRoutes();
  return result;
};

export const approveProduct = async (
  productId: number,
  status: 'approved' | 'rejected',
) => {
  const result = await withClerkSupabaseSession(() =>
    orderService.approveProduct(productId, status),
  );
  revalidateProductRoutes();
  return result;
};
