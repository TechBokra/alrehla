"use client";


import React, { useMemo } from 'react';
import { useParams, Link } from '@/lib/router-compat';
import { usePublicData } from '../../../hooks/queries/public/usePublicDataQuery';
import PageLoader from '@alrehla/ui/page-loader';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@alrehla/ui/card';
import Image from '@alrehla/ui/next-image';
import { Globe, Facebook, Twitter, Instagram, BookOpen, Library, Building2, ExternalLink } from 'lucide-react';
import { Button } from '@alrehla/ui/button';
import ErrorState from '@alrehla/ui/error-state';
import type { PersonalizedProduct } from '../../../lib/database.types';

// Reusing ProductCard style slightly modified
const PublisherProductCard: React.FC<{ product: PersonalizedProduct }> = ({ product }) => (
    <Card className="flex flex-col h-full hover:-translate-y-1 transition-transform border border-gray-100 shadow-sm hover:shadow-md">
        <div className="h-56 w-full overflow-hidden relative bg-gray-50">
            <Image 
                src={product.image_url || 'https://placehold.co/600x400'} 
                alt={product.title} 
                className="w-full h-full"
                objectFit="contain"
            />
            {product.product_type === 'library_book' && (
                <div className="absolute top-2 right-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                    <Library size={10} /> مكتبة
                </div>
            )}
        </div>
        <CardHeader className="pb-2">
            <CardTitle className="text-lg line-clamp-1">{product.title}</CardTitle>
            <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-bold text-primary">{product.price_printed}</span>
                <span className="text-xs text-muted-foreground">ج.م</span>
            </div>
        </CardHeader>
        <CardContent className="flex-grow">
            <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
        </CardContent>
        <CardFooter className="pt-0">
             <Button as={Link} to={`/enha-lak/order/${product.key}`} size="sm" className="w-full">
                اطلب الآن
            </Button>
        </CardFooter>
    </Card>
);

const PublisherPublicProfilePage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const { data, isLoading, error } = usePublicData();

    const publisher = useMemo(() => data?.publishers.find(p => p.slug === slug), [data, slug]);
    const publisherProducts = useMemo(() => {
        if (!publisher) return [];
        return (data?.personalizedProducts || []).filter(p => p.publisher_id === publisher.user_id && p.is_active !== false);
    }, [data, publisher]);

    if (isLoading) return <PageLoader text="جاري تحميل صفحة دار النشر..." />;
    
    if (error) return <ErrorState message={(error as Error).message} />;
    
    if (!publisher) return <div className="p-20 text-center text-muted-foreground">لم يتم العثور على دار النشر المطلوبة.</div>;

    const socialLinks = publisher.social_links || {};
    
    // Default cover if none provided
    const coverImage = publisher.cover_url || "https://images.unsplash.com/photo-1507842217153-e51f2949eb71?q=80&w=1920&auto=format&fit=crop";

    return (
        <div className="animate-fadeIn min-h-screen bg-gray-50/50">
            {/* Hero / Cover Section */}
            <div className="relative h-64 md:h-80 w-full overflow-hidden bg-gray-200">
                 <Image 
                    src={coverImage}
                    alt="Publisher Cover" 
                    className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            </div>

            {/* Profile Info */}
            <div className="container mx-auto px-4 relative z-10 -mt-20 mb-12">
                <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-end gap-6 border border-gray-100">
                    {/* Logo */}
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-white shadow-md border-4 border-white overflow-hidden flex-shrink-0 -mt-16 md:-mt-20">
                        <Image 
                            src={
                                !publisher.logo_url ||
                                publisher.logo_url.includes('wikimedia.org') ||
                                publisher.logo_url.includes('googleusercontent.com')
                                    ? '/placeholder-image.jpeg'
                                    : publisher.logo_url
                            } 
                            alt={publisher.store_name} 
                            className="w-full h-full"
                            objectFit="contain"
                        />
                    </div>
                    
                    {/* Info */}
                    <div className="flex-grow space-y-3 w-full">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
                                    {publisher.store_name}
                                    <span className="text-blue-500" title="دار نشر موثقة">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </span>
                                </h1>
                                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                                    <Building2 size={14}/> شريك معتمد في منصة الرحلة
                                </p>
                            </div>
                            
                            {/* Links */}
                            <div className="flex gap-3">
                                {publisher.website && (
                                    <a href={publisher.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-bold">
                                        <Globe size={16}/> الموقع
                                    </a>
                                )}
                                <div className="flex gap-2">
                                    {socialLinks.facebook && (
                                        <a href={socialLinks.facebook} target="_blank" rel="noreferrer" className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"><Facebook size={20}/></a>
                                    )}
                                    {socialLinks.twitter && (
                                        <a href={socialLinks.twitter} target="_blank" rel="noreferrer" className="p-2 bg-sky-50 text-sky-500 rounded-lg hover:bg-sky-100 transition-colors"><Twitter size={20}/></a>
                                    )}
                                    {socialLinks.instagram && (
                                        <a href={socialLinks.instagram} target="_blank" rel="noreferrer" className="p-2 bg-pink-50 text-pink-600 rounded-lg hover:bg-pink-100 transition-colors"><Instagram size={20}/></a>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        {/* Description */}
                        {publisher.description && (
                            <div className="pt-4 border-t mt-4">
                                <h3 className="text-sm font-bold text-gray-700 mb-2">عن الدار</h3>
                                <p className="text-gray-600 leading-relaxed text-sm md:text-base max-w-4xl">
                                    {publisher.description}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Products Grid */}
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center gap-3 mb-8 border-b pb-4">
                    <BookOpen className="text-primary" />
                    <h2 className="text-2xl font-bold text-gray-800">إصدارات الدار ({publisherProducts.length})</h2>
                </div>

                {publisherProducts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {publisherProducts.map(product => (
                            <PublisherProductCard key={product.id} product={product} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                             <BookOpen className="text-gray-400" size={32}/>
                        </div>
                        <h3 className="text-lg font-bold text-gray-700">لا توجد إصدارات حالياً</h3>
                        <p className="text-muted-foreground">لم يتم إضافة منتجات لهذه الدار حتى الآن.</p>
                        <Button as={Link} to="/enha-lak/store" variant="link" className="mt-2">
                            تصفح باقي المتجر
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PublisherPublicProfilePage;
