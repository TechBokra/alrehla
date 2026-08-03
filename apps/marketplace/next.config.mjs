import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { withSentryConfig } from '@sentry/nextjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const sentryDebug =
  process.env.SENTRY_DEBUG === 'true' ||
  process.env.NEXT_PUBLIC_SENTRY_DEBUG === 'true';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@alrehla/ui',
    '@alrehla/api',
    '@alrehla/auth',
    '@alrehla/supabase',
    '@alrehla/types',
    '@alrehla/config',
    '@alrehla/utils',
  ],
  images: {
    unoptimized: false,
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'i.ibb.co' },
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: 'yt3.googleusercontent.com' },
    ],
  },
  turbopack: {
    root: join(__dirname, '../../'),
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
    // Receipt actions accept at most 10 MiB; leave only minimal multipart overhead.
    serverActions: {
      bodySizeLimit: '11mb',
    },
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  silent: !process.env.CI,
  debug: sentryDebug,
  widenClientFileUpload: true,
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
  tunnelRoute: '/monitoring',
  errorHandler() {
    // Monitoring must never make a deploy unavailable.
  },
  webpack: {
    treeshake: {
      removeDebugLogging: !sentryDebug,
      excludeReplayIframe: true,
      excludeReplayShadowDOM: true,
    },
  },
});
