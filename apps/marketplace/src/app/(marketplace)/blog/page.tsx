import type { Metadata } from 'next';
import BlogPage from '@/features/blog';
import {
  getCanonicalUrl,
  getPublishedBlogPosts,
} from '@/services/publicBlogService';

export const revalidate = 300;

export function generateMetadata(): Metadata {
  const title = 'المدونة';
  const description =
    'مقالات ونصائح تربوية وإبداعية لمساعدة الأهل في رحلة تنمية أطفالهم.';
  const canonicalUrl = getCanonicalUrl('/blog');

  return {
    title,
    description,
    ...(canonicalUrl ? { alternates: { canonical: canonicalUrl } } : {}),
    openGraph: {
      type: 'website',
      locale: 'ar_EG',
      title,
      description,
      ...(canonicalUrl ? { url: canonicalUrl } : {}),
    },
  };
}

export default async function Page() {
  const posts = await getPublishedBlogPosts();
  return <BlogPage posts={posts} />;
}
