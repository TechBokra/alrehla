import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { alrehlaClerkAppearance } from '@alrehla/ui/clerk-appearance';
import Providers from './providers';
import '../global.css';

export const metadata: Metadata = {
  title: 'بوابة المدربين | منصة الرحلة',
  description: 'لوحة إدارة ومتابعة رحلات الطلاب والجداول والماليات للمدربين.',
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
