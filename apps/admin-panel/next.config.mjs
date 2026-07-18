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
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
