"use client";


import React, { useMemo, useState } from 'react';
import { Link } from '@/lib/router-compat';
import { usePublicData } from '../../../hooks/queries/public/usePublicDataQuery';
import { ProductCardSkeleton } from '../../../components/ui/Skeletons';
import { ArrowLeft, CheckCircle, Star, BookHeart, Puzzle, Gift, Library, User, Sparkles, Search, Filter, ArrowUpDown, Building2 } from 'lucide-react';
import type { PersonalizedProduct } from '../../../lib/database.types';
import { Button } from '../../../components/ui/Button';
import ErrorState from '../../../components/ui/ErrorState';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card';
import { cn } from '../../../lib/utils';
import Accordion from '../../../components/ui/Accordion';
import Image from '../../../components/ui/Image';
import { Tabs, TabsTrigger, TabsContent, TabsList } from '../../../components/ui/Tabs';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';

interface ProductCardProps {
    product: PersonalizedProduct;
    featured?: boolean;
    minSubscriptionPrice?: number;
}

const ProductCard = React.memo(React.forwardRef<HTMLElement, ProductCardProps>(({ product, featured = false, minSubscriptionPrice = 0 }, ref) => {
    const isSubscription = product.key === 'subscription_box';
    const orderLink = isSubscription ? '/enha-lak/subscription' : `/enha-lak/order/${product.key}`;
    const buttonText = isSubscription ? 'اشترك الآن' : 'اطلب الآن';
    const isLibraryBook = product.product_type === 'library_book';

    return (
        <Card ref={ref} className={cn(
            "flex flex-col transform hover:-translate-y-2 transition-transform duration-300 h-full border-2 hover:border-primary/20",
            featured ? "w-80 flex-shrink-0" : ""
        )}>
            <div className="h-64 w-full overflow-hidden relative bg-gray-50">
                <Image 
                    src={product.image_url || 'https://i.ibb.co/RzJzQhL/hero-image-new.jpg'} 
                    alt={product.title} 
                    className="w-full h-full transition-transform duration-500 hover:scale-110"
                    objectFit="contain"
                />
                 {isLibraryBook && (
                    <div className="absolute top-3 right-3 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md z-10 flex items-center gap-1">
                        <Library size={12} /> غلاف مخصص
                    </div>
                )}
                {product.product_type === 'hero_story' && !isSubscription && (
                    <div className="absolute top-3 right-3 bg-pink-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md z-10 flex items-center gap-1">
                       <User size={12} /> بطل القصة
                    </div>
                )}
            </div>
            <CardHeader>
                <CardTitle className="text-xl">{product.title}</CardTitle>
                
                {/* Publisher Name Badge */}
                {product.publisher?.name && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1 bg-gray-100 w-fit px-2 py-0.5 rounded">
                        <Building2 size={10} />
                        <span>{product.publisher.name}</span>
                    </div>
                )}

                <CardDescription className="min-h-[3.5rem] flex flex-col justify-end mt-2">
                    {isSubscription ? (
                        <>
                            <span className="text-lg font-bold text-foreground">باقات متنوعة</span>
                            <span className="text-sm text-muted-foreground block">
                                {minSubscriptionPrice > 0 ? `تبدأ من ${minSubscriptionPrice} ج.م/شهرياً` : 'باقات متعددة'}
                            </span>
                        </>
                    ) : product.has_printed_version && product.price_printed ? (
                         <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-extrabold text-foreground">{product.price_printed}</span>
                            <span className="text-sm font-medium text-muted-foreground">ج.م</span>
                            {product.price_electronic && <span className="text-xs text-muted-foreground mr-2 font-normal">(أو {product.price_electronic} إلكتروني)</span>}
                        </div>
                    ) : product.price_electronic ? (
                         <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-extrabold text-foreground">{product.price_electronic}</span>
                            <span className="text-sm font-medium text-muted-foreground">ج.م</span>
                        </div>
                    ) : null}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col flex-grow">
                <p className="text-muted-foreground text-sm flex-grow line-clamp-3 mb-4 leading-relaxed">{product.description}</p>
                {product.features && product.features.length > 0 && (
                     <Accordion title="عرض الميزات" className="mt-auto border-t pt-2">
                         <ul className="mt-2 space-y-2 text-sm p-1">
                            {product.features.map(feature => (
                                <li key={feature} className="flex items-start gap-2">
                                    <CheckCircle size={14} className="text-green-500 flex-shrink-0 mt-0.5" />
                                    <span className="text-muted-foreground text-xs">{feature}</span>
                                </li>
                            ))}
                        </ul>
                     </Accordion>
                )}
            </CardContent>
            <CardFooter className="mt-auto pt-0 pb-6">
                {product.is_addon ? (
                     <div className="relative group w-full">
                        <Button variant="secondary" className="w-full cursor-not-allowed bg-gray-100 text-gray-400">
                            <span>يُضاف في سلة الشراء</span>
                        </Button>
                        <div className="absolute bottom-full mb-2 w-full hidden group-hover:block bg-popover text-popover-foreground text-xs rounded py-1 px-2 text-center z-10 shadow-md">
                            هذا المنتج هو إضافة ولا يمكن طلبه منفرداً.
                        </div>
                    </div>
                ) : (
                    <Button as={Link} to={orderLink} variant={isLibraryBook ? "default" : "pink"} className="w-full shadow-sm hover:shadow-md transition-all">
                        <span>{buttonText}</span>
                        <ArrowLeft className="transform rotate-180" size={18} />
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}));
ProductCard.displayName = "ProductCard";


const PersonalizedStoriesPage: React.FC = () => {
  const { data, isLoading, error, refetch } = usePublicData();
  const content = data?.siteContent?.enhaLakPage.store;
  const personalizedProducts = data?.personalizedProducts || [];
  const subscriptionPlans = data?.subscriptionPlans || [];
  
  const [activeTab, setActiveTab] = useState('hero');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPublisher, setSelectedPublisher] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'default' | 'price-asc' | 'price-desc'>('default');

  // Calculate the minimum subscription price dynamically
  const lowestSubscriptionPrice = useMemo(() => {
      if (!subscriptionPlans.length) return 0;
      return Math.min(...subscriptionPlans.map(plan => plan.price_per_month));
  }, [subscriptionPlans]);

  // Extract unique publishers from products
  const publishers = useMemo(() => {
      const pubs = new Set<string>();
      personalizedProducts.forEach(p => {
          if (p.publisher?.name) {
              pubs.add(p.publisher.name);
          }
      });
      return Array.from(pubs);
  }, [personalizedProducts]);

  // 1. Base Search Filter (Global for all tabs)
  const searchedProducts = useMemo(() => {
      if (!searchTerm.trim()) return personalizedProducts;
      const term = searchTerm.toLowerCase();
      return personalizedProducts.filter(p => 
          (p.title && p.title.toLowerCase().includes(term)) || 
          (p.description && p.description.toLowerCase().includes(term))
      );
  }, [personalizedProducts, searchTerm]);

  // 2. Separate Products by Category (Applied after Search)
  const { subscriptionProduct, otherHeroStories, libraryBooks, addonProducts } = useMemo(() => {
    
    // Subscription Box
    const sub = personalizedProducts.find(p => p.key === 'subscription_box');
    
    // Hero Stories (Filtered by Search only)
    const hero = searchedProducts.filter(p => !p.is_addon && p.key !== 'subscription_box' && (p.product_type === 'hero_story' || !p.product_type));
    
    // Library Books (Filtered by Search + Publisher + Sort)
    let library = searchedProducts.filter(p => !p.is_addon && p.product_type === 'library_book');
    
    // Apply Publisher Filter (Only for Library)
    if (selectedPublisher !== 'all') {
        library = library.filter(p => p.publisher?.name === selectedPublisher);
    }

    // Apply Sort (Only for Library)
    if (sortOrder !== 'default') {
        library.sort((a, b) => {
            const priceA = a.price_printed || a.price_electronic || 0;
            const priceB = b.price_printed || b.price_electronic || 0;
            return sortOrder === 'price-asc' ? priceA - priceB : priceB - priceA;
        });
    } else {
        // Default sort by sort_order
        library.sort((a, b) => (a.sort_order || 99) - (b.sort_order || 99));
    }
    
    // Addons
    const addons = searchedProducts.filter(p => p.is_addon);
    
    return { subscriptionProduct: sub, otherHeroStories: hero, libraryBooks: library, addonProducts: addons };
  }, [searchedProducts, personalizedProducts, selectedPublisher, sortOrder]);
  
  return (
    <div className="bg-muted/30 py-12 sm:py-16 animate-fadeIn min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground">المتجر</h1>
                <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
                    كل ما يحتاجه طفلك من قصص ملهمة وكتب نافعة في مكان واحد
                </p>
            </div>
            
            {/* Global Search Bar */}
            <div className="max-w-3xl mx-auto mb-10 bg-white p-2 rounded-2xl shadow-sm border">
                <div className="relative">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input 
                        type="text" 
                        placeholder="ابحث عن قصة، كتاب، أو موضوع..." 
                        className="pr-12 h-12 rounded-xl border-none focus:ring-0 shadow-none text-lg"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            
            {error ? <ErrorState message={(error as Error).message} onRetry={refetch} /> : (
            <>
                 <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-12 w-full">
                    
                    <TabsList className="grid w-full grid-cols-2 gap-4 sm:gap-6 mb-10 h-auto bg-transparent p-0">
                        <TabsTrigger 
                            value="hero" 
                            className="h-16 sm:h-20 w-full rounded-2xl border-2 border-pink-200 bg-white text-gray-600 text-lg sm:text-xl font-bold shadow-sm transition-all hover:border-pink-400 hover:text-pink-600 data-[state=active]:bg-pink-600 data-[state=active]:text-white data-[state=active]:border-pink-600 data-[state=active]:shadow-lg data-[state=active]:scale-[1.02] flex items-center justify-center gap-3"
                        >
                            <User className="w-6 h-6 sm:w-8 sm:h-8" />
                            <span>أنت البطل هنا</span>
                        </TabsTrigger>

                        <TabsTrigger 
                            value="library" 
                            className="h-16 sm:h-20 w-full rounded-2xl border-2 border-blue-200 bg-white text-gray-600 text-lg sm:text-xl font-bold shadow-sm transition-all hover:border-blue-400 hover:text-blue-600 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-600 data-[state=active]:shadow-lg data-[state=active]:scale-[1.02] flex items-center justify-center gap-3"
                        >
                            <Library className="w-6 h-6 sm:w-8 sm:h-8" />
                            <span>المكتبة العامة</span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="hero" className="animate-fadeIn space-y-12 w-full">
                         {/* 1. Subscription Banner */}
                        {!searchTerm && (
                            <section className="bg-gradient-to-r from-pink-500 to-rose-500 p-8 sm:p-10 rounded-3xl shadow-xl text-white relative overflow-hidden">
                                 <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                                 <div className="absolute bottom-0 left-0 w-40 h-40 bg-yellow-400/20 rounded-full -ml-10 -mb-10 blur-2xl"></div>
                                 
                                <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                                    <div className="flex items-start gap-6">
                                        <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm shadow-inner hidden sm:block">
                                            <Gift size={48} className="text-yellow-300" />
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-extrabold mb-2 flex items-center gap-2">
                                                {subscriptionProduct?.title || content?.subscriptionBannerTitle}
                                                <Sparkles className="text-yellow-300 animate-pulse" />
                                            </h2>
                                            <p className="text-pink-100 text-lg max-w-xl leading-relaxed">
                                                {subscriptionProduct?.description || "هدية متجددة من الخيال تصل باب منزلك كل شهر."}
                                            </p>
                                            <div className="mt-4 flex flex-wrap gap-3">
                                                {subscriptionProduct?.features?.slice(0,3).map(f => (
                                                    <span key={f} className="text-xs font-bold bg-black/20 px-3 py-1 rounded-full flex items-center gap-1">
                                                        <CheckCircle size={12} /> {f}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center gap-2 min-w-[200px]">
                                         <div className="text-center mb-2">
                                            <span className="block text-sm text-pink-100 opacity-90">تبدأ من</span>
                                            <span className="text-3xl font-black text-white">{lowestSubscriptionPrice} ج.م</span>
                                            <span className="text-sm"> / شهرياً</span>
                                         </div>
                                         <Button as={Link} to="/enha-lak/subscription" variant="secondary" size="lg" className="w-full font-bold shadow-lg hover:scale-105 transition-transform text-pink-600">
                                            اشترك الآن
                                        </Button>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* 2. Hero Products Grid */}
                        <div>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-2 bg-pink-100 text-pink-600 rounded-lg"><Star size={24}/></div>
                                <h2 className="text-2xl font-bold text-gray-800">قصص أبطالها أطفالكم</h2>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 auto-rows-fr">
                                {isLoading ? (
                                    Array.from({ length: 3 }).map((_, index) => <ProductCardSkeleton key={`hero-skel-${index}`} />)
                                ) : (
                                    otherHeroStories.length > 0 ? otherHeroStories.map(product => (
                                        <ProductCard 
                                            key={`hero-${product.id}`} 
                                            product={product}
                                        />
                                    )) : <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed text-muted-foreground">لا توجد قصص في هذا القسم تطابق بحثك.</div>
                                )}
                            </div>
                        </div>

                         {/* 3. Addon Products - ONLY in Hero Tab */}
                        {addonProducts.length > 0 && (
                            <section className="mt-12 border-t pt-10">
                                <div className="text-center mb-10">
                                    <h2 className="text-3xl font-bold text-foreground flex items-center justify-center gap-3">
                                        <Puzzle className="text-green-500" /> {content?.addonProductsTitle}
                                    </h2>
                                    <p className="text-muted-foreground mt-2">منتجات ممتعة يمكن إضافتها لطلبك لتكتمل الهدية</p>
                                </div>
                            
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-fr">
                                    {isLoading ? (
                                        Array.from({ length: 2 }).map((_, index) => <ProductCardSkeleton key={`addon-skel-${index}`} />)
                                    ) : (
                                        addonProducts.map(product => (
                                            <ProductCard 
                                                key={`addon-${product.id}`} 
                                                product={product} 
                                            />
                                        ))
                                    )}
                                </div>
                            </section>
                        )}
                    </TabsContent>

                    <TabsContent value="library" className="animate-fadeIn w-full">
                         <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
                             {/* Title */}
                             <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><BookHeart size={24}/></div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800">المكتبة العامة للنشء</h2>
                                    <p className="text-sm text-muted-foreground">مجموعة مختارة من الكتب النافعة والقصص الملهمة للأطفال والشباب.</p>
                                </div>
                            </div>
                            
                            {/* Library Filters */}
                            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                                <div className="relative w-full sm:w-48">
                                     <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                                     <Select 
                                        value={selectedPublisher} 
                                        onChange={(e) => setSelectedPublisher(e.target.value)}
                                        className="w-full pr-10 h-10 text-sm bg-white"
                                     >
                                        <option value="all">كل دور النشر</option>
                                        {publishers.map(pub => (
                                            <option key={pub} value={pub}>{pub}</option>
                                        ))}
                                     </Select>
                                 </div>
                                 
                                 <div className="relative w-full sm:w-48">
                                     <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                                     <Select 
                                        value={sortOrder} 
                                        onChange={(e) => setSortOrder(e.target.value as any)}
                                        className="w-full pr-10 h-10 text-sm bg-white"
                                     >
                                        <option value="default">الترتيب الافتراضي</option>
                                        <option value="price-asc">السعر: من الأقل للأعلى</option>
                                        <option value="price-desc">السعر: من الأعلى للأقل</option>
                                     </Select>
                                 </div>
                            </div>
                        </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 auto-rows-fr">
                            {isLoading ? (
                                Array.from({ length: 3 }).map((_, index) => <ProductCardSkeleton key={`lib-skel-${index}`} />)
                            ) : (
                                libraryBooks.length > 0 ? libraryBooks.map(product => (
                                    <ProductCard 
                                        key={`lib-${product.id}`} 
                                        product={product}
                                    />
                                )) : <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed text-muted-foreground">لا توجد كتب تطابق خياراتك الحالية.</div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </>
            )}
        </div>
    </div>
  );
};

export default PersonalizedStoriesPage;
