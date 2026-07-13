"use client";


import React from 'react';
import { Link } from '@/lib/router-compat';
import type { BlogPost } from '../../lib/database.types';
import { formatDate } from '../../utils/helpers';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '../ui/card';
import Image from '../ui/Image';

interface PostCardProps {
    post: BlogPost;
}

const PostCard = React.forwardRef<HTMLAnchorElement, PostCardProps>(({ post }, ref) => {
    return (
        <Link to={`/blog/${post.slug}`} ref={ref} className="block h-full group no-underline">
            <Card className="overflow-hidden transition-transform transform hover:-translate-y-2 duration-300 h-full flex flex-col">
                <div className="h-48 w-full overflow-hidden">
                    <Image 
                        src={post.image_url || '/placeholder-image.jpeg'} 
                        alt={post.title} 
                        className="w-full h-full transition-transform duration-500 group-hover:scale-110" 
                        objectFit="cover"
                        width={800}
                        height={450}
                        sizes="(max-width: 768px) 100vw, 33vw"
                    />
                </div>
                <CardHeader>
                    <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                    <CardDescription>{formatDate(post.published_at)}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                    <p className="text-sm text-muted-foreground line-clamp-3">{post.content}</p>
                </CardContent>
                <CardFooter>
                    <span className="text-sm font-semibold text-primary group-hover:underline">اقرأ المزيد</span>
                </CardFooter>
            </Card>
        </Link>
    );
});
PostCard.displayName = 'PostCard';

export default React.memo(PostCard);

export const PostCardSkeleton: React.FC = () => (
    <Card className="overflow-hidden h-full flex flex-col">
        <div className="w-full h-48 bg-muted animate-pulse" />
        <CardHeader>
            <div className="h-6 w-3/4 bg-muted rounded animate-pulse"></div>
            <div className="h-4 w-1/2 bg-muted rounded animate-pulse mt-2"></div>
        </CardHeader>
        <CardContent className="flex-grow">
            <div className="space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse"></div>
                <div className="h-4 bg-muted rounded animate-pulse"></div>
                <div className="h-4 w-5/6 bg-muted rounded animate-pulse"></div>
            </div>
        </CardContent>
        <CardFooter>
             <div className="h-5 w-24 bg-muted rounded animate-pulse"></div>
        </CardFooter>
    </Card>
);
