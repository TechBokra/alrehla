"use client";

import React from 'react';
import { ArrowLeft, Building2, CheckCircle, Library, User } from 'lucide-react';
import { Button } from '@alrehla/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@alrehla/ui/card';
import Accordion from '@alrehla/ui/accordion';
import Image from '@alrehla/ui/next-image';
import type { PersonalizedProduct } from '../../../lib/database.types';
import { Link } from '@/lib/router-compat';

export type ProductCardVariant = 'custom' | 'library' | 'addon';

interface PersonalizedProductCardProps {
  product: PersonalizedProduct;
  variant: ProductCardVariant;
  href?: string;
}

const PersonalizedProductCard: React.FC<PersonalizedProductCardProps> = ({ product, variant, href }) => {
  const isLibrary = variant === 'library';
  const isAddon = variant === 'addon';
  const badge = isLibrary ? 'غلاف مخصص فقط' : isAddon ? 'إضافة اختيارية' : 'تخصيص كامل';
  const badgeClass = isLibrary ? 'bg-blue-600' : isAddon ? 'bg-emerald-600' : 'bg-pink-600';
  const resolvedHref = href || (isLibrary ? `/enha-lak/library/${encodeURIComponent(product.key)}` : `/enha-lak/custom/${encodeURIComponent(product.key)}`);

  return (
    <Card className="flex h-full flex-col border-2 transition-transform duration-300 hover:-translate-y-1 hover:border-primary/20">
      <div className="relative h-64 w-full overflow-hidden bg-gray-50">
        <Image
          src={product.image_url || '/images/hero-image-new.jpg'}
          alt={product.title}
          className="h-full w-full transition-transform duration-500 hover:scale-105"
          objectFit="contain"
        />
        <div className={`absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold text-white shadow-md ${badgeClass}`}>
          {isLibrary ? <Library size={12} /> : <User size={12} />}
          {badge}
        </div>
      </div>

      <CardHeader>
        <CardTitle className="text-xl">{product.title}</CardTitle>
        {product.publisher?.name && isLibrary && (
          <div className="mt-1 flex w-fit items-center gap-1 rounded bg-gray-100 px-2 py-0.5 text-xs text-muted-foreground">
            <Building2 size={10} />
            <span>{product.publisher.name}</span>
          </div>
        )}
        <CardDescription className="mt-2 flex min-h-[3.5rem] flex-col justify-end">
          {product.has_printed_version && product.price_printed ? (
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-foreground">{product.price_printed}</span>
              <span className="text-sm font-medium text-muted-foreground">ج.م</span>
              {product.price_electronic && <span className="mr-2 text-xs text-muted-foreground">(أو {product.price_electronic} إلكتروني)</span>}
            </div>
          ) : product.price_electronic ? (
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-foreground">{product.price_electronic}</span>
              <span className="text-sm font-medium text-muted-foreground">ج.م</span>
            </div>
          ) : null}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-grow flex-col">
        <p className="mb-4 line-clamp-3 flex-grow text-sm leading-relaxed text-muted-foreground">{product.description}</p>
        {product.features && product.features.length > 0 && (
          <Accordion title="عرض الميزات" className="mt-auto border-t pt-2">
            <ul className="mt-2 space-y-2 p-1 text-sm">
              {product.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <CheckCircle size={14} className="mt-0.5 flex-shrink-0 text-green-500" />
                  <span className="text-xs text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>
          </Accordion>
        )}
      </CardContent>

      <CardFooter className="mt-auto pt-0">
        {isAddon ? (
          <p className="w-full rounded-lg bg-muted px-3 py-2 text-center text-sm font-semibold text-muted-foreground">
            يُختار من داخل التجربة المخصصة
          </p>
        ) : (
          <Button as={Link} to={resolvedHref} variant={isLibrary ? 'default' : 'pink'} className="w-full">
            {isLibrary ? 'عرض تفاصيل القصة' : 'ابدأ التخصيص'}
            <ArrowLeft className="rotate-180" size={18} />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default React.memo(PersonalizedProductCard);
