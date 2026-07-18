import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Resolve the monorepo root from this app's location (apps/admin-panel → ../../)
// This works both locally and on Vercel when Root Directory = apps/admin-panel
const monorepoRoot = join(__dirname, '../../');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@alrehla/ui',
    '@alrehla/api',
    '@alrehla/auth',
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
    root: monorepoRoot,
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
