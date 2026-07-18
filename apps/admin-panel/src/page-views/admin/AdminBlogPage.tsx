
import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Plus, Edit, Trash2, Filter, Search, Eye } from 'lucide-react';
import { useAdminBlogPosts } from '../../hooks/queries/admin/useAdminContentQuery';
import { useContentMutations } from '../../hooks/mutations/useContentMutations';
import PageLoader from '@alrehla/ui/page-loader';
import { formatDate } from '../../utils/helpers';
import type { BlogPost } from '../../lib/database.types';
import { Button } from '@alrehla/ui/button';
import ErrorState from '@alrehla/ui/error-state';
import { Card, CardHeader, CardTitle, CardContent } from '@alrehla/ui/card';
import DataTable from '../../components/admin/ui/DataTable';
import { Input } from '@alrehla/ui/input';
import { Select } from '@alrehla/ui/native-select';

const createNavigate = (router: ReturnType<typeof useRouter>) => (
    href: string | number,
    options?: { replace?: boolean },
) => {
    if (typeof href === 'number') {
        router.back();
        return;
    }

    const target = href || '/';
    if (options?.replace) router.replace(target);
    else router.push(target);
};

const AdminBlogPage: React.FC = () => {
    const router = useRouter();
    const navigate = createNavigate(router);
    const { data: posts = [], isLoading, error, refetch } = useAdminBlogPosts();
    const { bulkUpdateBlogPostsStatus, bulkDeleteBlogPosts } = useContentMutations();
    
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');

    const filteredPosts = useMemo(() => {
        return posts.filter(post => {
            const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [posts, searchTerm, statusFilter]);

    const handleDeletePost = (postId: number) => {
        if (window.confirm('هل أنت متأكد من حذف هذا المقال؟')) {
            bulkDeleteBlogPosts.mutate({ postIds: [postId] });
        }
    };

    if (isLoading) return <PageLoader text="جاري تحميل المقالات..." />;
    if (error) return <ErrorState message={(error as Error).message} onRetry={refetch} />;

    return (
        <div className="animate-fadeIn space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-foreground">إدارة المدونة</h1>
                    <p className="text-muted-foreground mt-1">نشر وتعديل المقالات والمحتوى الإثراي.</p>
                </div>
                <Button onClick={() => navigate('/blog/new')} icon={<Plus size={18} />} size="lg">
                    مقال جديد
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><FileText /> مكتبة المقالات</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="flex-1 relative">
                            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <Input 
                                placeholder="بحث في العناوين..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pr-10"
                            />
                        </div>
                        <div className="w-full md:w-48">
                            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
                                <option value="all">كل الحالات</option>
                                <option value="published">منشور</option>
                                <option value="draft">مسودة</option>
                            </Select>
                        </div>
                    </div>

                   <DataTable<BlogPost>
                        data={filteredPosts}
                        columns={[
                            { 
                                accessorKey: 'title', 
                                header: 'العنوان',
                                cell: ({ value }) => <span className="font-bold text-foreground">{value}</span>
                            },
                            { 
                                accessorKey: 'status', 
                                header: 'الحالة',
                                cell: ({ value }) => (
                                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${value === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {value === 'published' ? 'منشور' : 'مسودة'}
                                    </span>
                                )
                            },
                            { 
                                accessorKey: 'author_name', 
                                header: 'الكاتب',
                            },
                            { 
                                accessorKey: 'published_at', 
                                header: 'تاريخ النشر',
                                cell: ({ value }) => value ? formatDate(value as string) : '-'
                            },
                        ]}
                         bulkActions={[
                            {
                                label: 'نشر المحدد',
                                action: (selected) => bulkUpdateBlogPostsStatus.mutate({ postIds: selected.map(s => s.id), status: 'published' }),
                            },
                            {
                                label: 'تحويل إلى مسودة',
                                action: (selected) => bulkUpdateBlogPostsStatus.mutate({ postIds: selected.map(s => s.id), status: 'draft' }),
                            },
                            {
                                label: 'حذف المحدد',
                                action: (selected) => {
                                    if (window.confirm(`هل أنت متأكد من حذف ${selected.length} مقالات؟`)) {
                                        bulkDeleteBlogPosts.mutate({ postIds: selected.map(s => s.id) });
                                    }
                                },
                                isDestructive: true,
                            }
                        ]}
                        renderRowActions={(post) => (
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" onClick={() => navigate(`/blog/${post.id}`)} title="تعديل">
                                    <Edit size={18} className="text-blue-600" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => window.open(`#/blog/${post.slug}`, '_blank')} title="معاينة">
                                    <Eye size={18} className="text-gray-600" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeletePost(post.id)} title="حذف">
                                    <Trash2 size={18} />
                                </Button>
                            </div>
                        )}
                   />
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminBlogPage;
