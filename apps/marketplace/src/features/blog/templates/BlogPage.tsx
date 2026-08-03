import type { BlogPost } from '@alrehla/types';
import PostCard from '../../../components/shared/PostCard';

type BlogPageProps = {
    posts: BlogPost[];
};

const BlogPage = ({ posts }: BlogPageProps) => {
    return (
        <div className="bg-gray-50 py-16 sm:py-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-blue-600">المدونة</h1>
                    <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600">
                        مقالات ونصائح تربوية وإبداعية لمساعدتكم في رحلة تنمية أطفالكم.
                    </p>
                </div>

                {posts.length > 0 ? (
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
