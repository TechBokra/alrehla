import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { MarketplaceFloatingWidgets, MarketplaceTopWidgets } from './marketplace-widgets';

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col" dir="rtl">
      <MarketplaceTopWidgets />
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
      <MarketplaceFloatingWidgets />
    </div>
  );
}
