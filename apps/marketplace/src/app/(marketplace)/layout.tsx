import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { AuthProvider } from '@/contexts/AuthContext';
import { getServerAuthState } from '@/lib/server/currentUser';
import { MarketplaceFloatingWidgets, MarketplaceTopWidgets } from './marketplace-widgets';

/**
 * Bootstrap the client auth context from the server for every marketplace
 * route. This removes the Clerk -> client effect -> profile sync waterfall.
 * The authenticated marketplace shell is intentionally dynamic because it
 * reads the request session with Clerk's server-side auth() helper.
 */
export default async function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  const initialAuth = await getServerAuthState();

  return (
    <AuthProvider initialAuth={initialAuth}>
      <div className="flex min-h-screen flex-col" dir="rtl">
        <MarketplaceTopWidgets />
        <Header />
        <main className="flex-grow">{children}</main>
        <Footer />
        <MarketplaceFloatingWidgets />
      </div>
    </AuthProvider>
  );
}
