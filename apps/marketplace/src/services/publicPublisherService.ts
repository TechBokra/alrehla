import 'server-only';

import { createPublicSupabaseClient } from '@alrehla/supabase/public';
import type {
  Database,
  PersonalizedProduct,
  PublisherProfile,
} from '@alrehla/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { unstable_cache } from 'next/cache';

export const PUBLISHER_REVALIDATE_SECONDS = 300;

export type PublicPublisherProduct = Pick<
  PersonalizedProduct,
  | 'id'
  | 'key'
  | 'title'
  | 'product_type'
  | 'description'
  | 'image_url'
  | 'price_printed'
  | 'publisher_id'
>;

export type PublicPublisher = Pick<
  PublisherProfile,
  | 'id'
  | 'user_id'
  | 'store_name'
  | 'slug'
  | 'logo_url'
  | 'cover_url'
  | 'description'
  | 'website'
  | 'social_links'
  | 'created_at'
>;

export type PublicPublisherPageData = {
  publisher: PublicPublisher;
  products: PublicPublisherProduct[];
};

const publisherColumns =
  'id,user_id,store_name,slug,logo_url,cover_url,description,website,social_links,created_at' as const;
const publisherProductColumns =
  'id,key,title,product_type,description,image_url,price_printed,publisher_id' as const;

let publicPublisherClient: SupabaseClient<Database> | null = null;

const getPublicPublisherClient = (): SupabaseClient<Database> => {
  if (publicPublisherClient) return publicPublisherClient;

  try {
    publicPublisherClient = createPublicSupabaseClient();
  } catch {
    throw new Error('إعدادات خدمة دور النشر غير صالحة.');
  }

  return publicPublisherClient;
};

export const getPublicPublisherBySlug = async (
  slug: string,
): Promise<PublicPublisherPageData | null> => {
  const normalizedSlug = slug.trim();
  if (
    !normalizedSlug ||
    normalizedSlug.length > 160 ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalizedSlug)
  ) {
    return null;
  }

  return unstable_cache(
    async () => {
      const client = getPublicPublisherClient();
      const { data: publisher, error: publisherError } = await client
        .from('publisher_profiles')
        .select(publisherColumns)
        .eq('slug', normalizedSlug)
        .maybeSingle();

      if (publisherError) {
        throw new Error('تعذر تحميل بيانات دار النشر.');
      }
      const publicPublisher = publisher as PublicPublisher | null;
      if (!publicPublisher) return null;

      const { data: products, error: productsError } = await client
        .from('personalized_products')
        .select(publisherProductColumns)
        .eq('publisher_id', publicPublisher.user_id)
        .eq('is_active', true)
        .eq('approval_status', 'approved')
        .is('deleted_at', null)
        .order('sort_order', { ascending: true })
        .limit(100);

      if (productsError) {
        throw new Error('تعذر تحميل إصدارات دار النشر.');
      }

      return {
        publisher: publicPublisher,
        products: (products ?? []) as PublicPublisherProduct[],
      };
    },
    ['marketplace', 'public-publisher', normalizedSlug],
    {
      revalidate: PUBLISHER_REVALIDATE_SECONDS,
      tags: [
        'marketplace:publishers',
        'marketplace:products',
        `marketplace:publisher-slug:${normalizedSlug}`,
      ],
    },
  )();
};
