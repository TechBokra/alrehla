import { ArrowUpDown, BookHeart, Building2, Search } from 'lucide-react';
import { Button } from '@alrehla/ui/button';
import PersonalizedProductCard from '../../enha-lak-store/components/PersonalizedProductCard';
import { getEnhaLakData } from '../../../services/enhaLakPublicService';

type LibrarySearchParams = {
  search?: string;
  publisher?: string;
  sort?: string;
};

interface LibraryPageProps {
  searchParams?: LibrarySearchParams;
}

const getParam = (value: string | undefined, fallback = '') =>
  typeof value === 'string' ? value : fallback;

const LibraryPage = async ({ searchParams = {} }: LibraryPageProps) => {
  const { personalizedProducts: products } = await getEnhaLakData();
  const searchTerm = getParam(searchParams.search).trim();
  const selectedPublisher = getParam(searchParams.publisher, 'all') || 'all';
  const requestedSort = getParam(searchParams.sort, 'default');
  const sortOrder = ['default', 'price-asc', 'price-desc'].includes(requestedSort)
    ? requestedSort
    : 'default';

  const publishers = Array.from(
    new Set(
      products
        .filter((product) => product.product_type === 'library_book' && product.publisher?.name)
        .map((product) => product.publisher!.name),
    ),
  );

  const normalizedSearchTerm = searchTerm.toLocaleLowerCase();
  const libraryBooks = products
    .filter((product) => {
      if (product.product_type !== 'library_book') return false;
      if (selectedPublisher !== 'all' && product.publisher?.name !== selectedPublisher) return false;
      if (!normalizedSearchTerm) return true;

      return (
        product.title.toLocaleLowerCase().includes(normalizedSearchTerm) ||
        (product.description || '').toLocaleLowerCase().includes(normalizedSearchTerm)
      );
    })
    .sort((a, b) => {
      if (sortOrder === 'price-asc') {
        return (a.price_printed || a.price_electronic || 0) - (b.price_printed || b.price_electronic || 0);
      }
      if (sortOrder === 'price-desc') {
        return (b.price_printed || b.price_electronic || 0) - (a.price_printed || a.price_electronic || 0);
      }
      return (a.sort_order || 99) - (b.sort_order || 99);
    });

  return (
    <div className="min-h-screen bg-muted/30 py-12 sm:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mx-auto mb-10 max-w-3xl text-center">
          <p className="text-sm font-bold tracking-wide text-blue-600">المكتبة العامة</p>
          <h1 className="mt-2 text-4xl font-extrabold text-foreground sm:text-5xl">قصص جاهزة، غلاف مخصص</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            تصفح القصص المتاحة واختر ما يناسب طفلك. محتوى القصة الأصلي يبقى كما هو؛ التخصيص يقتصر على الغلاف والخيارات المدعومة.
          </p>
        </header>

        <form method="get" className="mx-auto mb-10 max-w-3xl rounded-2xl border bg-white p-3 shadow-sm">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} aria-hidden="true" />
            <input
              name="search"
              defaultValue={searchTerm}
              placeholder="ابحث في قصص المكتبة..."
              aria-label="ابحث في قصص المكتبة"
              className="h-12 w-full rounded-md border-none bg-transparent pr-12 text-lg outline-none ring-0 placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <div className="relative flex-1 sm:max-w-48">
              <Building2 className="pointer-events-none absolute right-3 top-1/2 z-10 -translate-y-1/2 text-gray-400" size={16} aria-hidden="true" />
              <select
                name="publisher"
                defaultValue={selectedPublisher}
                aria-label="فلترة حسب دار النشر"
                className="h-10 w-full appearance-none rounded-md border bg-white px-3 pr-10 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <option value="all">كل دور النشر</option>
                {publishers.map((publisher) => <option key={publisher} value={publisher}>{publisher}</option>)}
              </select>
            </div>
            <div className="relative flex-1 sm:max-w-48">
              <ArrowUpDown className="pointer-events-none absolute right-3 top-1/2 z-10 -translate-y-1/2 text-gray-400" size={16} aria-hidden="true" />
              <select
                name="sort"
                defaultValue={sortOrder}
                aria-label="ترتيب القصص"
                className="h-10 w-full appearance-none rounded-md border bg-white px-3 pr-10 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <option value="default">الترتيب الافتراضي</option>
                <option value="price-asc">السعر: من الأقل للأعلى</option>
                <option value="price-desc">السعر: من الأعلى للأقل</option>
              </select>
            </div>
            <Button type="submit" variant="default" className="h-10 flex-shrink-0">تطبيق</Button>
          </div>
        </form>

        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-lg bg-blue-100 p-2 text-blue-600"><BookHeart size={24} /></div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">إصدارات المكتبة</h2>
            <p className="text-sm text-muted-foreground">اختر قصة جاهزة ثم انتقل إلى تخصيص الغلاف.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {libraryBooks.length > 0 ? libraryBooks.map((product) => (
            <PersonalizedProductCard key={product.id} product={product} variant="library" />
          )) : (
            <div className="col-span-full rounded-xl border border-dashed bg-white py-12 text-center text-muted-foreground">
              لا توجد قصص تطابق خيارات البحث الحالية.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LibraryPage;
