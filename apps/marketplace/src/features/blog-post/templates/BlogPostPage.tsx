import type { BlogPost } from '@alrehla/types';
import Link from 'next/link';
import { formatDate } from '../../../utils/helpers';
import ShareButtons from '../../../components/shared/ShareButtons';
import { ArrowLeft } from 'lucide-react';
import Image from '@alrehla/ui/next-image';

type BlogPostPageProps = {
    post: BlogPost;
    pageUrl: string;
};

const BlogPostPage = ({ post, pageUrl }: BlogPostPageProps) => {
    return (
        <div className="bg-white py-16 sm:py-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-semibold mb-8">
                        <ArrowLeft size={16} />
                        العودة إلى المدونة
                    </Link>
                    <article>
                        <header className="mb-8">
                             <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-800 leading-tight">{post.title}</h1>
                            <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                               <span>{post.author_name}</span>
                               <span>{formatDate(post.published_at)}</span>
                            </div>
                        </header>
                        
                        {post.image_url && (
                             <div className="mb-10 w-full rounded-2xl overflow-hidden shadow-lg">
                                 <Image 
                                    src={post.image_url} 
                                    alt={post.title} 
                                    width={1200}
                                    height={675}
                                    sizes="(max-width: 1024px) 100vw, 896px"
                                    className="w-full h-64 md:h-96" 
                                    objectFit="cover"
                                />
                             </div>
                        )}

                        <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed text-right">
                           {post.content.split('\n').map((paragraph, index) => (
                                <p key={index}>{paragraph}</p>
                            ))}
                        </div>

                        <footer className="mt-12 pt-8 border-t">
                             <ShareButtons title={post.title} url={pageUrl} label="شارك المقال:" />
                        </footer>
                    </article>
                </div>
            </div>
        </div>
    );
};

export default BlogPostPage;
