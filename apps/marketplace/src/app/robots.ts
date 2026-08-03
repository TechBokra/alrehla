import type { MetadataRoute } from 'next';
import { getCanonicalUrl } from '@/services/publicBlogService';

export default function robots(): MetadataRoute.Robots {
  const sitemapUrl = getCanonicalUrl('/sitemap.xml');

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/account',
        '/api',
        '/auth',
        '/cart',
        '/checkout',
        '/creative-writing/booking',
        '/journey',
        '/login',
        '/notifications',
        '/session',
        '/signup',
        '/sso-callback',
        '/sentry-example-page',
        '/sentry-test',
      ],
    },
    ...(sitemapUrl ? { sitemap: sitemapUrl.toString() } : {}),
  };
}
