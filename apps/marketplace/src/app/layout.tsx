import type { Metadata } from 'next';
import Providers from './providers';
import MarketplaceShell from '@/features/routing/MarketplaceShell';
import './globals.css';
import { Suspense } from 'react';
import { Cairo } from 'next/font/google';
import { Loader2Icon } from 'lucide-react';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['200', '300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'الرحلة | Alrehla',
  description: 'منصة عربية تعليمية وإبداعية للقصص المخصصة وبرامج الكتابة الإبداعية.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={cairo.className}>
        <Providers>
          <Suspense
            fallback={
              <div className="flex h-screen items-center justify-center">
                <Loader2Icon className="animate-spin" size={24} />
              </div>
            }
          >
            <MarketplaceShell>{children}</MarketplaceShell>
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
