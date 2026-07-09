import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
    unoptimized: true,
  },
  turbopack: {
    root: join(__dirname, '../../'),
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
