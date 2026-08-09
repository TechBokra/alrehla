"use client";

import React, { useMemo } from 'react';
import { Gift, Sparkles } from 'lucide-react';
import { usePublicData } from '../../../hooks/queries/public/usePublicDataQuery';
import { ProductCardSkeleton } from '@alrehla/ui/skeletons';
import ErrorState from '@alrehla/ui/error-state';
import { Card, CardContent, CardHeader, CardTitle } from '@alrehla/ui/card';
import { Button } from '@alrehla/ui/button';
import { Link } from '@/lib/router-compat';
import PersonalizedProductCard from '../../enha-lak-store/components/PersonalizedProductCard';

const CustomExperiencesPage: React.FC = () => {
  const { data, isLoading, error, refetch } = usePublicData();
  const products = data?.personalizedProducts || [];
  const customProducts = useMemo(
    () => products.filter((product) => !product.is_addon && product.product_type === 'hero_story'),
    [products],
  );
  const addons = useMemo(() => products.filter((product) => product.is_addon), [products]);
  const subscription = products.find((product) => product.product_type === 'subscription_box');

  return (
    <div className="min-h-screen bg-muted/30 py-12 sm:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mx-auto mb-12 max-w-3xl text-center">
          <p className="text-sm font-bold tracking-wide text-pink-600">أنت البطل هنا</p>
          <h1 className="mt-2 text-4xl font-extrabold text-foreground sm:text-5xl">تجارب مخصصة لطفلك</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            اختر التجربة المناسبة، ثم شاركنا تفاصيل طفلك وأهدافك. يبدأ فريقنا بصناعة المحتوى بعد إتمام الطلب.
          </p>
        </header>

        {error ? <ErrorState message={(error as Error).message} onRetry={refetch} /> : (
          <>
            <section aria-labelledby="custom-products-heading">
              <div className="mb-8 flex items-center gap-3">
                <div className="rounded-lg bg-pink-100 p-2 text-pink-600"><Sparkles size={24} /></div>
                <div>
                  <h2 id="custom-products-heading" className="text-2xl font-bold text-foreground">اختر تجربتك</h2>
                  <p className="text-sm text-muted-foreground">كل منتج هنا نقطة بداية لتجربة يتم إعدادها لطفلك.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? Array.from({ length: 3 }).map((_, index) => <ProductCardSkeleton key={index} />) : (
                  customProducts.length > 0 ? customProducts.map((product) => (
                    <PersonalizedProductCard key={product.id} product={product} variant="custom" />
                  )) : (
                    <div className="col-span-full rounded-xl border border-dashed bg-white py-12 text-center text-muted-foreground">
                      لا توجد تجارب مخصصة متاحة حالياً.
                    </div>
                  )
                )}
              </div>
            </section>

            {addons.length > 0 && (
              <section className="mt-16 border-t pt-12" aria-labelledby="custom-addons-heading">
                <div className="mb-8 text-center">
                  <h2 id="custom-addons-heading" className="flex items-center justify-center gap-3 text-2xl font-bold text-foreground">
                    <Gift className="text-emerald-500" /> إضافات اختيارية
                  </h2>
                  <p className="mt-2 text-muted-foreground">يمكن اختيارها داخل خطوات التجربة المخصصة.</p>
                </div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                  {addons.map((product) => <PersonalizedProductCard key={product.id} product={product} variant="addon" />)}
                </div>
              </section>
            )}

            {subscription && (
              <Card className="mx-auto mt-16 max-w-3xl border-pink-200 bg-pink-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Gift className="text-pink-600" /> {subscription.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
                  <p className="text-muted-foreground">{subscription.description}</p>
                  <Button as={Link} to="/enha-lak/subscription" variant="pink" className="flex-shrink-0">اعرف المزيد</Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CustomExperiencesPage;
