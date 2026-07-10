
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Eye, Calendar, User, Image as ImageIcon, Type, Globe, FileText, Clock } from 'lucide-react';
import { useAdminBlogPosts } from '../../hooks/queries/admin/useAdminContentQuery';
import { useContentMutations } from '../../hooks/mutations/useContentMutations';
import PageLoader from '../../components/ui/PageLoader';
import { Button } from '../../components/ui/Button';
import FormField from '../../components/ui/FormField';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import ImageUploadField from '../../components/admin/ui/ImageUploadField';
import type { BlogPost } from '../../lib/database.types';
import { cloudinaryService } from '../../services/cloudinaryService';

const AdminBlogPostEditorPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isNew = id === 'new';

    const { data: posts = [], isLoading: postsLoading } = useAdminBlogPosts();
    const { createBlogPost, updateBlogPost } = useContentMutations();

    const [post, setPost] = useState<Partial<BlogPost>>({
        title: '',
        slug: '',
        content: '',
        author_name: 'فريق المنصة',
        status: 'draft',
        image_url: null,
        published_at: null
    });

    const [initialImageUrl, setInitialImageUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!isNew && posts.length > 0) {
            const existingPost = posts.find(p => p.id === Number(id));
            if (existingPost) {
                setPost(existingPost);
                setInitialImageUrl(existingPost.image_url || null);
            } else if (!postsLoading) {
                navigate('/blog');
            }
        } else if (isNew) {
            // Set default date to now for new posts
            setPost(prev => ({ ...prev, published_at: new Date().toISOString() }));
        }
    }, [id, isNew, posts, postsLoading, navigate]);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if ((post.image_url as any) instanceof File) {
                e.preventDefault();
                e.returnValue = 'لديك تغييرات غير محفوظة في الصورة. هل أنت متأكد من المغادرة؟';
                return e.returnValue;
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [post.image_url]);

    const handleBack = (e: React.MouseEvent) => {
        e.preventDefault();
        if ((post.image_url as any) instanceof File) {
            if (!window.confirm('لديك تغييرات غير محفوظة في الصورة. هل تريد المغادرة وإلغاء التغييرات؟')) {
                return;
            }
        }
        navigate('/blog');
    };


    // تحسين دالة توليد الروابط لدعم العربية ومنع التكرار
    const generateSlug = (text: string) => {
        const baseSlug = text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')     // استبدال المسافات بشرطات
            .replace(/[^\u0600-\u06FF\w\-]+/g, '') // الحفاظ على الحروف العربية والانجليزية والشرطات فقط
            .replace(/\-\-+/g, '-')   // منع تكرار الشرطات
            .replace(/^-+/, '')       // حذف الشرطات من البداية
            .replace(/-+$/, '');      // حذف الشرطات من النهاية
            
        // إضافة بصمة زمنية عشوائية للمقالات الجديدة لضمان التفرد
        if (isNew && baseSlug) {
            const randomSuffix = Math.floor(Math.random() * 10000).toString();
            return `${baseSlug}-${randomSuffix}`;
        }
        
        return baseSlug;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setPost(prev => {
            const newState = { ...prev, [name]: value };
            // توليد الرابط تلقائياً فقط عند كتابة العنوان في مقال جديد ولم يقم المستخدم بتعديل الرابط يدوياً بعد
            if (name === 'title' && isNew) {
                newState.slug = generateSlug(value);
            }
            return newState;
        });
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const dateValue = e.target.value;
        if (dateValue) {
            const date = new Date(dateValue);
            setPost(prev => ({ ...prev, published_at: date.toISOString() }));
        } else {
            setPost(prev => ({ ...prev, published_at: null }));
        }
    };

    const handleImageChange = (key: string, value: any) => {
        setPost(prev => ({ ...prev, image_url: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        let finalPost = { ...post };
        if (finalPost.status === 'published' && !finalPost.published_at) {
            finalPost.published_at = new Date().toISOString();
        }

        let imageFile = null;
        if ((finalPost.image_url as any) instanceof File) {
            imageFile = finalPost.image_url as any;
            finalPost.image_url = ''; 
        }

        const payload = { ...finalPost, imageFile };

        try {
            if (isNew) {
                await createBlogPost.mutateAsync(payload);
            } else {
                await updateBlogPost.mutateAsync(payload);
            }

            if (initialImageUrl && imageFile) {
                const publicId = cloudinaryService.getPublicIdFromUrl(initialImageUrl);
                if (publicId) {
                    await cloudinaryService.deleteAsset(publicId);
                }
            }

            navigate('/blog');
        } catch (error: any) {
            console.error("Failed to save post", error);
        }
    };

    // Helper to format ISO date to datetime-local input value (YYYY-MM-DDTHH:mm)
    const getFormattedDate = (isoString: string | null | undefined) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        // Adjust for timezone offset to display correctly in local time
        const offset = date.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 16);
        return localISOTime;
    };

    const isSaving = createBlogPost.isPending || updateBlogPost.isPending;
    const wordCount = post.content?.split(/\s+/).filter(Boolean).length || 0;
    const readTime = Math.ceil(wordCount / 200); 

    if (postsLoading && !isNew) return <PageLoader text="جاري تحميل المقال..." />;

    return (
        <div className="animate-fadeIn space-y-6 pb-20">
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sticky top-0 z-20 bg-background/95 backdrop-blur p-4 border-b -mx-6 px-6 shadow-sm">
                <div className="flex items-center gap-4">
                    <Link to="/blog" onClick={handleBack} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                        <ArrowLeft className="transform rotate-180" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground line-clamp-1">
                            {isNew ? 'كتابة مقال جديد' : `تعديل: ${post.title}`}
                        </h1>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className={`inline-block w-2 h-2 rounded-full ${post.status === 'published' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                            <span>{post.status === 'published' ? 'منشور' : 'مسودة'}</span>
                            <span>•</span>
                            <span>{wordCount} كلمة</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button type="button" variant="outline" className="flex-1 sm:flex-none" icon={<Eye size={16}/>} onClick={() => window.open(`#/blog/${post.slug || ''}`, '_blank')}>
                        معاينة
                    </Button>
                    <Button type="submit" form="blog-form" loading={isSaving} className="flex-1 sm:flex-none" icon={<Save size={16}/>}>
                        {isSaving ? 'جاري الحفظ...' : 'حفظ ونشر'}
                    </Button>
                </div>
            </div>

            <form id="blog-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Main Content Editor */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-t-4 border-t-primary">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Type /> المحتوى الرئيسي</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <FormField label="عنوان المقال" htmlFor="title">
                                <Input id="title" name="title" value={post.title} onChange={handleChange} required placeholder="اكتب عنواناً جذاباً..." className="text-lg font-bold py-6" />
                            </FormField>
                            
                            <FormField label="نص المقال" htmlFor="content">
                                <div className="relative">
                                    <Textarea 
                                        id="content" 
                                        name="content" 
                                        value={post.content} 
                                        onChange={handleChange} 
                                        rows={20} 
                                        required 
                                        placeholder="اكتب محتوى المقال هنا..." 
                                        className="font-serif text-lg leading-relaxed min-h-[500px] p-6"
                                    />
                                    <div className="absolute bottom-4 left-4 text-xs text-muted-foreground bg-background/80 px-2 rounded">
                                        {readTime} دقيقة قراءة
                                    </div>
                                </div>
                            </FormField>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Settings */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base"><Save size={18} /> إعدادات النشر</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField label="الحالة" htmlFor="status">
                                <Select id="status" name="status" value={post.status} onChange={handleChange}>
                                    <option value="draft">مسودة (غير منشور)</option>
                                    <option value="published">منشور / مجدول</option>
                                </Select>
                            </FormField>

                            <FormField label="تاريخ النشر" htmlFor="published_at">
                                <div className="relative">
                                    <Clock className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                    <Input 
                                        id="published_at" 
                                        type="datetime-local"
                                        value={getFormattedDate(post.published_at)} 
                                        onChange={handleDateChange} 
                                        className="pr-10" 
                                    />
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-1">
                                    إذا اخترت تاريخاً مستقبلياً، لن يظهر المقال للزوار حتى يحين الموعد.
                                </p>
                            </FormField>
                            
                            <FormField label="الكاتب" htmlFor="author_name">
                                <div className="relative">
                                    <User className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                    <Input id="author_name" name="author_name" value={post.author_name} onChange={handleChange} className="pr-10" />
                                </div>
                            </FormField>

                            {post.published_at && (
                                <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md flex items-center gap-2">
                                    <Calendar size={14} />
                                    <span>
                                        {new Date(post.published_at) > new Date() ? 'سيتم النشر في:' : 'نُشر في:'} 
                                        {' '}
                                        {new Date(post.published_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base"><ImageIcon size={18} /> الصورة البارزة</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ImageUploadField 
                                label="صورة الغلاف" 
                                fieldKey="image_url" 
                                currentUrl={post.image_url || ''} 
                                onUrlChange={handleImageChange}
                                recommendedSize="1200x630px"
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base"><Globe size={18} /> تحسين محركات البحث (SEO)</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <FormField label="الرابط الدائم (Slug)" htmlFor="slug">
                                <Input id="slug" name="slug" value={post.slug} onChange={handleChange} dir="ltr" className="font-mono text-sm" />
                                <p className="text-[10px] text-muted-foreground mt-1 truncate" dir="ltr">
                                    alrehla.com/blog/{post.slug}
                                </p>
                            </FormField>
                            <div className="p-3 bg-blue-50 rounded text-xs text-blue-700">
                                <p className="font-bold mb-1">معاينة النتيجة في جوجل:</p>
                                <p className="text-blue-800 text-sm font-semibold truncate">{post.title || 'عنوان المقال'}</p>
                                <p className="text-green-700 truncate" dir="ltr">alrehla.com/blog/{post.slug}</p>
                                <p className="text-gray-600 line-clamp-2">{post.content?.substring(0, 150)}...</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </form>
        </div>
    );
};

export default AdminBlogPostEditorPage;
