import 'server-only';

import { createPublicSupabaseClient } from '@alrehla/supabase/public';
import type { Database, SiteContent, SocialLinks } from '@alrehla/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { unstable_cache } from 'next/cache';

const MARKETPLACE_SHELL_REVALIDATE_SECONDS = 300;

export interface MarketplaceShellData {
  siteContent: SiteContent | null;
  socialLinks: SocialLinks | null;
}

let publicClient: SupabaseClient<Database> | null = null;

const getPublicClient = (): SupabaseClient<Database> => {
  if (publicClient) return publicClient;

  try {
    publicClient = createPublicSupabaseClient();
  } catch {
    throw new Error('إعدادات محتوى منصة الرحلة غير صالحة.');
  }

  return publicClient;
};

const readMarketplaceShellData = async (): Promise<MarketplaceShellData> => {
  const { data, error } = await getPublicClient()
    .from('public_settings')
    .select('key,value')
    .in('key', ['global_content', 'social_links']);

  if (error) throw new Error('تعذر تحميل محتوى تذييل الموقع.');

  const settings = (data ?? []) as Array<{ key: string; value: unknown }>;
  const getSetting = <T>(key: string): T | null =>
    (settings.find((setting) => setting.key === key)?.value as T | undefined) ?? null;

  return {
    siteContent: getSetting<SiteContent>('global_content'),
    socialLinks: getSetting<SocialLinks>('social_links'),
  };
};

export const getMarketplaceShellData = unstable_cache(
  readMarketplaceShellData,
  ['marketplace', 'shell-data'],
  {
    revalidate: MARKETPLACE_SHELL_REVALIDATE_SECONDS,
    tags: [
      'marketplace:shell',
      'marketplace:public-data',
      'marketplace:social-links',
    ],
  },
);
