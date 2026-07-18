import type { Metadata } from 'next';
import { Cairo } from 'next/font/google';
import Providers from './providers';
import StudentAppEffects from './app-effects';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { alrehlaClerkAppearance } from '@alrehla/ui/clerk-appearance';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'لوحة الطالب | الرحلة',
  description: 'لوحة طالب الرحلة لمتابعة الرحلات التدريبية ومعرض الأعمال.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider appearance={alrehlaClerkAppearance}>
      <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={cairo.className}>
        <Providers>{children}</Providers>
        <StudentAppEffects />
      </body>
      </html>
    </ClerkProvider>
  );
}
