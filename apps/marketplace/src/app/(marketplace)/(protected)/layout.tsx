import ProfileCompletionGuard from '@/components/auth/ProfileCompletionGuard';

export default function ProtectedMarketplaceLayout({ children }: { children: React.ReactNode }) {
  return <ProfileCompletionGuard>{children}</ProfileCompletionGuard>;
}
