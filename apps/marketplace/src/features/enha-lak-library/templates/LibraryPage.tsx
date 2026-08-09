"use client";

import React, { useMemo, useState } from 'react';
import { ArrowUpDown, BookHeart, Building2, Search } from 'lucide-react';
import { usePublicData } from '../../../hooks/queries/public/usePublicDataQuery';
import { ProductCardSkeleton } from '@alrehla/ui/skeletons';
import ErrorState from '@alrehla/ui/error-state';
import { Input } from '@alrehla/ui/input';
import { Select } from '@alrehla/ui/native-select';
import PersonalizedProductCard from '../../enha-lak-store/components/PersonalizedProductCard';

const LibraryPage: React.FC = () => {
  const { data, isLoading, error, refetch } = usePublicData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPublisher, setSelectedPublisher] = useState('all');
  const [sortOrder, setSortOrder] = useState<'default' | 'price-asc' | 'price-desc'>('default');
  const products = data?.personalizedProducts || [];

  const publishers = useMemo(() => Array.from(new Set(
    products.filter((product) => product.product_type === 'library_book' && product.publisher?.name).map((product) => product.publisher!.name),
  )), [products]);

  const libraryBooks = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const books = products.filter((product) => {
      if (product.product_type !== 'library_book') return false;
      if (selectedPublisher !== 'all' && product.publisher?.name !== selectedPublisher) return false;
      if (!term) return true;
      return product.title.toLowerCase().includes(term) || (product.description || '').toLowerCase().includes(term);
    });
    return [...books].sort((a, b) => {
      if (sortOrder === 'price-asc') return (a.price_printed || a.price_electronic || 0) - (b.price_printed || b.price_electronic || 0);
      if (sortOrder === 'price-desc') return (b.price_printed || b.price_electronic || 0) - (a.price_printed || a.price_electronic || 0);
      return (a.sort_order || 99) - (b.sort_order || 99);
    });
  }, [products, searchTerm, selectedPublisher, sortOrder]);

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

        <div className="mx-auto mb-10 max-w-3xl rounded-2xl border bg-white p-2 shadow-sm">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="ابحث في قصص المكتبة..." className="h-12 border-none pr-12 text-lg shadow-none" />
          </div>
        </div>

        {error ? <ErrorState message={(error as Error).message} onRetry={refetch} /> : (
          <>
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2 text-blue-600"><BookHeart size={24} /></div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">إصدارات المكتبة</h2>
                  <p className="text-sm text-muted-foreground">اختر قصة جاهزة ثم انتقل إلى تخصيص الغلاف.</p>
                </div>
              </div>
              <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
                <div className="relative sm:w-48">
                  <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <Select value={selectedPublisher} onChange={(event) => setSelectedPublisher(event.target.value)} className="h-10 w-full bg-white pr-10 text-sm">
                    <option value="all">كل دور النشر</option>
                    {publishers.map((publisher) => <option key={publisher} value={publisher}>{publisher}</option>)}
                  </Select>
                </div>
                <div className="relative sm:w-48">
                  <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <Select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as typeof sortOrder)} className="h-10 w-full bg-white pr-10 text-sm">
                    <option value="default">الترتيب الافتراضي</option>
                    <option value="price-asc">السعر: من الأقل للأعلى</option>
                    <option value="price-desc">السعر: من الأعلى للأقل</option>
                  </Select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {isLoading ? Array.from({ length: 3 }).map((_, index) => <ProductCardSkeleton key={index} />) : (
                libraryBooks.length > 0 ? libraryBooks.map((product) => (
                  <PersonalizedProductCard key={product.id} product={product} variant="library" />
                )) : (
                  <div className="col-span-full rounded-xl border border-dashed bg-white py-12 text-center text-muted-foreground">لا توجد قصص تطابق خيارات البحث الحالية.</div>
                )
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LibraryPage;
