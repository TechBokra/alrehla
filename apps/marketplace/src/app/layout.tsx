import type { Metadata } from 'next';
import Providers from './providers';
import AppEffects from './app-effects';
import './globals.css';
import { Cairo } from 'next/font/google';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '600', '700'],
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
        <Providers>{children}</Providers>
        <AppEffects />
      </body>
    </html>
  );
}
