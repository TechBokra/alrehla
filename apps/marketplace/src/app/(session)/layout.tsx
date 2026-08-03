import { AuthProvider } from '@/contexts/AuthContext';
import { getServerAuthState } from '@/lib/server/currentUser';

export default async function SessionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialAuth = await getServerAuthState();

  return <AuthProvider initialAuth={initialAuth}>{children}</AuthProvider>;
}
