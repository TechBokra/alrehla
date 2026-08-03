import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { alrehlaClerkAppearance } from '@alrehla/ui/clerk-appearance';
import Providers from './providers';
import '../global.css';

export const metadata: Metadata = {
  title: 'بوابة الإدارة | الرحلة',
  description: 'لوحة إدارة منصة الرحلة للعمليات والمحتوى والماليات.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider appearance={alrehlaClerkAppearance}>
      <html lang="ar" dir="rtl" suppressHydrationWarning>
        <body>
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
