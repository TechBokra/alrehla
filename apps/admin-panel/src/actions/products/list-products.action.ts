'use server';

import { auth } from '@clerk/nextjs/server';
import { runWithSupabaseAccessTokenProvider, supabase } from '@alrehla/api/lib/supabaseClient';
import type { PersonalizedProduct } from '@alrehla/types';

export type ProductsQueryResult = PersonalizedProduct[];

const withClerkSupabaseSession = async <T>(operation: () => Promise<T>): Promise<T> => {
  try {
    const session = await auth();

    if (!session?.userId) {
      return operation();
    }

    return runWithSupabaseAccessTokenProvider(async () => {
      const token = await session.getToken();
      return token || '';
    }, operation);
  } catch (err) {
    console.warn('Auth session resolution warning, falling back to default provider:', err);
    return operation();
  }
};

/**
 * Query action: retrieves all personalized products with publisher details.
 */
export async function getPersonalizedProducts(): Promise<ProductsQueryResult> {
  return withClerkSupabaseSession(async () => {
    const { data, error } = await supabase
      .from('personalized_products')
      .select('*, publisher:profiles!personalized_products_publisher_id_fkey(name)')
      .is('deleted_at', null)
      .order('sort_order');

    if (error) {
      console.error('Fetch personalized products error', error);
      throw new Error(error.message || 'تعذر تحميل المنتجات.');
    }

    return (data || []) as PersonalizedProduct[];
  });
}

export const listProductsAction = getPersonalizedProducts;
