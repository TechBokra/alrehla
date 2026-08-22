import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { AuthProvider } from '@/contexts/AuthContext';
import { MarketplaceFloatingWidgets, MarketplaceTopWidgets } from '../(marketplace)/marketplace-widgets';

/**
 * Public Enha Lak shell: it keeps the interactive header available, but does
 * not read Clerk/Supabase session cookies on the server for anonymous pages.
 * Authenticated order routes remain under the dynamic marketplace shell.
 */
export default function EnhaLakPublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider initialAuth={null}>
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
