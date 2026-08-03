import type { MetadataRoute } from 'next';
import {
  getCanonicalUrl,
  getPublishedBlogPosts,
} from '@/services/publicBlogService';

export const revalidate = 300;

const publicRoutes: Array<{
  path: string;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>;
  priority: number;
}> = [
  { path: '/', changeFrequency: 'weekly', priority: 1 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/support', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/join-us', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/blog', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/enha-lak', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/enha-lak/store', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/enha-lak/subscription', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/creative-writing', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/creative-writing/about', changeFrequency: 'monthly', priority: 0.7 },
  {
    path: '/creative-writing/instructors',
    changeFrequency: 'weekly',
    priority: 0.8,
  },
  {
    path: '/creative-writing/packages',
    changeFrequency: 'weekly',
    priority: 0.8,
  },
  {
    path: '/creative-writing/services',
    changeFrequency: 'weekly',
    priority: 0.8,
  },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteRoot = getCanonicalUrl('/');
  if (!siteRoot) {
    return [];
  }

  const staticEntries: MetadataRoute.Sitemap = publicRoutes.map(
    ({ path, changeFrequency, priority }) => ({
      url: new URL(path, siteRoot).toString(),
      changeFrequency,
      priority,
    }),
  );

  const posts = await getPublishedBlogPosts();
  const articleEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: new URL(`/blog/${encodeURIComponent(post.slug)}`, siteRoot).toString(),
    lastModified: post.published_at || post.created_at,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [...staticEntries, ...articleEntries];
}
