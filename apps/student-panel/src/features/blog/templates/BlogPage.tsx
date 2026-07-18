"use client";


import React from 'react';
import { usePublicData } from '../../../hooks/queries/public/usePublicDataQuery';
import PageLoader from '@alrehla/ui/page-loader';
import PostCard, { PostCardSkeleton } from '../../../components/shared/PostCard';
import ErrorState from '@alrehla/ui/error-state';

const BlogPage: React.FC = () => {
    const { data, isLoading, error, refetch } = usePublicData();

    // Although the API filters this, we add a client-side safety check
    const posts = data?.blogPosts.filter(p => {
        const isPublished = p.status === 'published';
        const isPastDate = p.published_at ? new Date(p.published_at) <= new Date() : false;
        return isPublished && isPastDate;
    }) || [];

    if (isLoading) {
        return (
            <div className="bg-gray-50 py-16 sm:py-20 animate-fadeIn">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <div className="h-12 w-1/3 bg-gray-200 rounded animate-pulse mx-auto mb-4"></div>
                        <div className="h-6 w-1/2 bg-gray-200 rounded animate-pulse mx-auto"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <PostCardSkeleton key={index} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 py-16 sm:py-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-blue-600">المدونة</h1>
                    <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600">
                        مقالات ونصائح تربوية وإبداعية لمساعدتكم في رحلة تنمية أطفالكم.
                    </p>
                </div>

                {error ? (
                    <ErrorState message={(error as Error).message} onRetry={refetch} />
                ) : posts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {posts.map(post => (
                            <PostCard key={post.id} post={post} />
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-gray-500">لا توجد مقالات منشورة حاليًا.</p>
                )}
            </div>
        </div>
    );
};

export default BlogPage;
