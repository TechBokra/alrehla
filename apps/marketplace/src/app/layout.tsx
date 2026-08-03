import type { Metadata } from 'next';
import Providers from './providers';
import './globals.css';
import '@fontsource-variable/cairo/wght.css';
import { ClerkProvider } from '@clerk/nextjs';
import { alrehlaClerkAppearance } from '@alrehla/ui/clerk-appearance';
import { GoogleAnalytics } from '@next/third-parties/google';
import { getCanonicalUrl } from '@/services/publicBlogService';

const metadataBase = getCanonicalUrl('/');

export const metadata: Metadata = {
  ...(metadataBase ? { metadataBase } : {}),
  icons: {
    icon: '/favicon.ico',
    apple: '/images/favicon.png',
  },
  title: {
    default: 'الرحلة | Alrehla',
    template: '%s | الرحلة',
  },
  description: 'منصة عربية تعليمية وإبداعية للقصص المخصصة وبرامج الكتابة الإبداعية.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const gaTrackingId = process.env.NEXT_PUBLIC_GA_TRACKING_ID;

  const isGoogleAnalyticsEnabled =
    process.env.NODE_ENV === 'production' &&
    process.env.VERCEL_ENV === 'production' &&
    Boolean(gaTrackingId);

  return (
    <ClerkProvider appearance={alrehlaClerkAppearance}>
      <html lang="ar" dir="rtl" suppressHydrationWarning>
        <body className="font-sans">
          <Providers>{children}</Providers>
        </body>
        {isGoogleAnalyticsEnabled && gaTrackingId ? (
          <GoogleAnalytics gaId={gaTrackingId} />
        ) : null}
      </html>
    </ClerkProvider>
  );
}
