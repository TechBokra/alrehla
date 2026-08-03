import type { Metadata } from 'next';
import Providers from './providers';
import StudentAppEffects from './app-effects';
import './globals.css';
import '@fontsource-variable/cairo/wght.css';
import { ClerkProvider } from '@clerk/nextjs';
import { alrehlaClerkAppearance } from '@alrehla/ui/clerk-appearance';

export const metadata: Metadata = {
  title: 'لوحة الطالب | الرحلة',
  description: 'لوحة طالب الرحلة لمتابعة الرحلات التدريبية ومعرض الأعمال.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider appearance={alrehlaClerkAppearance}>
      <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="font-sans">
        <Providers>{children}</Providers>
        <StudentAppEffects />
      </body>
      </html>
    </ClerkProvider>
  );
}
