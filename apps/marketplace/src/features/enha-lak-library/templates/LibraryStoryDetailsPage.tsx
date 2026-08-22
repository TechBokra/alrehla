import { ArrowLeft, Building2, CheckCircle, Library } from 'lucide-react';
import { Button } from '@alrehla/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@alrehla/ui/card';
import Image from '@alrehla/ui/next-image';
import type { PersonalizedProduct } from '@alrehla/types';

interface LibraryStoryDetailsPageProps {
  product: PersonalizedProduct;
}

const LibraryStoryDetailsPage = ({ product }: LibraryStoryDetailsPageProps) => (
  <div className="min-h-screen bg-muted/30 py-12 sm:py-16">
    <div className="container mx-auto max-w-5xl px-4">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-start">
        <div className="overflow-hidden rounded-3xl bg-white p-6 shadow-sm">
          <Image src={product.image_url || '/images/hero-image-new.jpg'} alt={product.title} className="aspect-square w-full" objectFit="contain" />
        </div>
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-bold text-blue-700">
            <Library size={16} /> قصة جاهزة من المكتبة
          </div>
          <h1 className="text-4xl font-extrabold text-foreground">{product.title}</h1>
          {product.publisher?.name && <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground"><Building2 size={15} /> {product.publisher.name}</p>}
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{product.description}</p>

          <Card className="mt-8 border-blue-100 bg-blue-50/60">
            <CardHeader><CardTitle className="text-lg">ما الذي يمكن تخصيصه؟</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>محتوى القصة الأصلي يبقى كما هو ولا تتم إعادة كتابته.</p>
              <p>يمكن تخصيص الغلاف والاسم والصورة أو الإهداء فقط حسب الخيارات المتاحة لهذا الكتاب.</p>
            </CardContent>
          </Card>

          {product.features && product.features.length > 0 && (
            <ul className="mt-8 space-y-3">
              {product.features.map((feature) => <li key={feature} className="flex items-start gap-3 text-muted-foreground"><CheckCircle className="mt-0.5 flex-shrink-0 text-green-500" size={18} />{feature}</li>)}
            </ul>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button href={`/enha-lak/library/${encodeURIComponent(product.key)}/personalize`} size="lg" className="sm:flex-1">
              خصص الغلاف الآن <ArrowLeft className="rotate-180" size={18} />
            </Button>
            <Button href="/enha-lak/library" size="lg" variant="outline">العودة للمكتبة</Button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default LibraryStoryDetailsPage;
