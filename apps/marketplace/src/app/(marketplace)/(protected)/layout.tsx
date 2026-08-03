import type { Metadata } from 'next';
import ProfileCompletionGuard from '@/components/auth/ProfileCompletionGuard';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProtectedMarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProfileCompletionGuard>{children}</ProfileCompletionGuard>;
}
