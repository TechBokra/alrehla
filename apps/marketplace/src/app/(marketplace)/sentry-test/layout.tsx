import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { areDiagnosticsEnabled } from '@/lib/server/diagnostics';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function SentryTestLayout({ children }: { children: React.ReactNode }) {
  if (!areDiagnosticsEnabled()) {
    notFound();
  }

  return children;
}
