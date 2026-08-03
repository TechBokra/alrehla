import 'server-only';

import { createPublicSupabaseClient } from '@alrehla/supabase/public';
import type { BlogPost, Database } from '@alrehla/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { unstable_cache } from 'next/cache';

export const BLOG_CACHE_TAG = 'blog';
export const BLOG_REVALIDATE_SECONDS = 300;

const publishedBlogPostColumns =
    'id,slug,title,content,author_name,image_url,status,published_at,created_at,deleted_at' as const;

let publicBlogClient: SupabaseClient<Database> | null = null;

const getPublicBlogClient = (): SupabaseClient<Database> => {
    if (publicBlogClient) return publicBlogClient;

    try {
        publicBlogClient = createPublicSupabaseClient();
    } catch {
        throw new Error('إعدادات خدمة المدونة غير صالحة.');
    }

    return publicBlogClient;
};

export const getBlogPostCacheTag = (slug: string) => `${BLOG_CACHE_TAG}:${slug}`;

const readPublishedBlogPosts = async (): Promise<BlogPost[]> => {
    const { data, error } = await getPublicBlogClient()
        .from('blog_posts')
        .select(publishedBlogPostColumns)
        .eq('status', 'published')
        .lte('published_at', new Date().toISOString())
        .is('deleted_at', null)
        .order('published_at', { ascending: false });

    if (error) {
        throw new Error('تعذر تحميل مقالات المدونة.');
    }

    return data ?? [];
};

export const getPublishedBlogPosts = unstable_cache(
    readPublishedBlogPosts,
    ['marketplace', 'published-blog-posts'],
    {
        revalidate: BLOG_REVALIDATE_SECONDS,
        tags: [BLOG_CACHE_TAG],
    },
);

export const getPublishedBlogPostBySlug = async (
    slug: string,
): Promise<BlogPost | null> => {
    const normalizedSlug = slug.trim();
    if (!normalizedSlug || normalizedSlug.length > 200) return null;

    return unstable_cache(
        async () => {
            const { data, error } = await getPublicBlogClient()
                .from('blog_posts')
                .select(publishedBlogPostColumns)
                .eq('slug', normalizedSlug)
                .eq('status', 'published')
                .lte('published_at', new Date().toISOString())
                .is('deleted_at', null)
                .maybeSingle();

            if (error) {
                throw new Error('تعذر تحميل المقال.');
            }

            return data;
        },
        ['marketplace', 'published-blog-post', normalizedSlug],
        {
            revalidate: BLOG_REVALIDATE_SECONDS,
            tags: [BLOG_CACHE_TAG, getBlogPostCacheTag(normalizedSlug)],
        },
    )();
};

const getConfiguredSiteUrl = (): URL | null => {
    const configuredUrl =
        process.env.SITE_URL ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        process.env.VERCEL_PROJECT_PRODUCTION_URL ||
        (process.env.VERCEL_ENV === 'production' ? process.env.VERCEL_URL : undefined);

    if (!configuredUrl) return null;

    try {
        const url = new URL(
            configuredUrl.startsWith('http://') || configuredUrl.startsWith('https://')
                ? configuredUrl
                : `https://${configuredUrl}`,
        );

        if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
            return null;
        }

        url.pathname = '/';
        url.search = '';
        url.hash = '';
        return url;
    } catch {
        return null;
    }
};

export const getCanonicalUrl = (pathname: string): URL | null => {
    const siteUrl = getConfiguredSiteUrl();
    if (!siteUrl || !pathname.startsWith('/') || pathname.startsWith('//')) {
        return null;
    }

    const canonicalUrl = new URL(pathname, siteUrl);
    return canonicalUrl.origin === siteUrl.origin ? canonicalUrl : null;
};
