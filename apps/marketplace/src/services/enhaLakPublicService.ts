import 'server-only';

import { createPublicSupabaseClient } from '@alrehla/supabase/public';
import type {
  Database,
  PersonalizedProduct,
  SiteContent,
  ShippingCosts,
  SubscriptionPlan,
} from '@alrehla/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { unstable_cache } from 'next/cache';

export const ENHA_LAK_REVALIDATE_SECONDS = 300;
export const ENHA_LAK_CACHE_TAG = 'marketplace:enha-lak';

const PUBLIC_PRODUCT_COLUMNS = [
  'id',
  'key',
  'title',
  'product_type',
  'description',
  'image_url',
  'features',
  'sort_order',
  'is_featured',
  'is_addon',
  'is_active',
  'has_printed_version',
  'price_printed',
  'price_electronic',
  'image_slots',
  'text_fields',
  'goal_config',
  'story_goals',
  'component_keys',
  'publisher:public_profiles(name)',
].join(',');

export interface EnhaLakPublicData {
  siteContent: SiteContent | null;
  personalizedProducts: PersonalizedProduct[];
}

export interface EnhaLakSubscriptionData extends EnhaLakPublicData {
  subscriptionPlans: SubscriptionPlan[];
  shippingCosts: ShippingCosts | null;
}

let publicClient: SupabaseClient<Database> | null = null;

const getPublicClient = (): SupabaseClient<Database> => {
  if (publicClient) return publicClient;

  try {
    publicClient = createPublicSupabaseClient();
  } catch {
    throw new Error('إعدادات خدمة إنها لك غير صالحة.');
  }

  return publicClient;
};

const readEnhaLakData = async (): Promise<EnhaLakPublicData> => {
  const client = getPublicClient();

  const [{ data: settings, error: settingsError }, { data: products, error: productsError }] =
    await Promise.all([
      client
        .from('public_settings')
        .select('value')
        .eq('key', 'global_content')
        .maybeSingle(),
      client
        .from('personalized_products')
        .select(PUBLIC_PRODUCT_COLUMNS)
        .is('deleted_at', null)
        .eq('is_active', true)
        .eq('approval_status', 'approved')
        .order('sort_order', { ascending: true }),
    ]);

  if (settingsError || productsError) {
    throw new Error('تعذر تحميل محتوى إنها لك.');
  }

  const personalizedProducts = ((products ?? []) as unknown as PersonalizedProduct[]).map(
    (product) => ({
      ...product,
      publisher: product.publisher || { name: 'الرحلة' },
    }),
  );

  return {
    siteContent: ((settings as { value?: SiteContent } | null)?.value ?? null) as SiteContent | null,
    personalizedProducts,
  };
};

export const getEnhaLakData = unstable_cache(
  readEnhaLakData,
  ['marketplace', 'enha-lak-public-data'],
  {
    revalidate: ENHA_LAK_REVALIDATE_SECONDS,
    tags: [
      ENHA_LAK_CACHE_TAG,
      'marketplace:products',
      'marketplace:public-data',
    ],
  },
);

const readEnhaLakSubscriptionData = async (): Promise<EnhaLakSubscriptionData> => {
  const [enhaLakData, { data: plans, error: plansError }, { data: shipping, error: shippingError }] =
    await Promise.all([
      getEnhaLakData(),
      getPublicClient()
        .from('subscription_plans')
        .select('id,name,duration_months,price,price_per_month,savings_text,is_best_value')
        .is('deleted_at', null)
        .order('price', { ascending: true }),
      getPublicClient()
        .from('public_settings')
        .select('value')
        .eq('key', 'shipping_costs')
        .maybeSingle(),
    ]);

  if (plansError || shippingError) {
    throw new Error('تعذر تحميل بيانات الاشتراك.');
  }

  return {
    ...enhaLakData,
    subscriptionPlans: (plans ?? []) as unknown as SubscriptionPlan[],
    shippingCosts: ((shipping as { value?: ShippingCosts } | null)?.value ?? null) as ShippingCosts | null,
  };
};

export const getEnhaLakSubscriptionData = unstable_cache(
  readEnhaLakSubscriptionData,
  ['marketplace', 'enha-lak-subscription-data'],
  {
    revalidate: ENHA_LAK_REVALIDATE_SECONDS,
    tags: [
      ENHA_LAK_CACHE_TAG,
      'marketplace:products',
      'marketplace:plans',
      'marketplace:shipping-costs',
      'marketplace:public-data',
    ],
  },
);

export const getEnhaLakProduct = async (
  productKey: string,
): Promise<PersonalizedProduct | null> => {
  const normalizedKey = productKey.trim();
  if (!normalizedKey || normalizedKey.length > 160) return null;

  const { personalizedProducts } = await getEnhaLakData();
  return personalizedProducts.find((product) => product.key === normalizedKey) ?? null;
};
