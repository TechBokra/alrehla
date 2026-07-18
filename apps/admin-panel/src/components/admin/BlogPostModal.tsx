
import React, { useState, useEffect } from 'react';
import type { BlogPost } from '../../lib/database.types';
import Modal from '@alrehla/ui/modal';
import { Button } from '@alrehla/ui/button';
import FormField from '@alrehla/ui/form-field';
import { Input } from '@alrehla/ui/input';
import { Textarea } from '@alrehla/ui/textarea';
import { Select } from '@alrehla/ui/native-select';
import { compressImage } from '../../utils/imageCompression';
import { useToast } from '../../contexts/ToastContext';
import { Loader2 } from 'lucide-react';

interface BlogPostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (payload: {
        id?: number;
        title: string;
        slug: string;
        content: string;
        author_name: string;
        status: 'draft' | 'published';
        imageFile: File | null;
    }) => void;
    post: BlogPost | null;
    isSaving: boolean;
}

export const BlogPostModal: React.FC<BlogPostModalProps> = ({ isOpen, onClose, onSave, post, isSaving }) => {
    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [content, setContent] = useState('');
    const [authorName, setAuthorName] = useState('فريق المنصة');
    const [status, setStatus] = useState<'draft' | 'published'>('draft');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        if (isOpen) {
            if (post) {
                setTitle(post.title);
                setSlug(post.slug);
                setContent(post.content);
                setAuthorName(post.author_name);
                setStatus(post.status);
                setPreview(post.image_url);
            } else {
                setTitle('');
                setSlug('');
                setContent('');
                setAuthorName('فريق المنصة');
                setStatus('draft');
                setPreview(null);
            }
            setImageFile(null);
        }
    }, [post, isOpen]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (file) {
            setIsProcessing(true);
            try {
                const compressedDataUrl = await compressImage(file, 1200); // Larger width for blog
                const res = await fetch(compressedDataUrl);
                const blob = await res.blob();
                const compressedFile = new File([blob], file.name, { type: 'image/jpeg' });
                
                setImageFile(compressedFile);
                setPreview(compressedDataUrl);
            } catch(e) {
                addToast('فشل ضغط الصورة', 'error');
            } finally {
                setIsProcessing(false);
            }
        } else {
            setImageFile(null);
            setPreview(post?.image_url || null);
        }
    };
    
    const generateSlug = (text: string) => {
        return text.toLowerCase()
            .replace(/\s+/g, '-')           // Replace spaces with -
            .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
            .replace(/\-\-+/g, '-')         // Replace multiple - with single -
            .replace(/^-+/, '')             // Trim - from start of text
            .replace(/-+$/, '');            // Trim - from end of text
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTitle = e.target.value;
        setTitle(newTitle);
        if (!post) { // Only auto-generate slug for new posts
            setSlug(generateSlug(newTitle));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ id: post?.id, title, slug, content, author_name: authorName, status, imageFile });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={post ? 'تعديل المقال' : 'مقال جديد'}
            size="3xl"
            footer={
                <>
                    <Button type="button" onClick={onClose} disabled={isSaving || isProcessing} variant="ghost">إلغاء</Button>
                    <Button type="submit" form="blog-post-form" loading={isSaving || isProcessing}>
                        {isSaving ? 'جاري الحفظ...' : 'حفظ'}
                    </Button>
                </>
            }
        >
                <form id="blog-post-form" onSubmit={handleSubmit} className="space-y-6">
                    <FormField label="العنوان*" htmlFor="title">
                        <Input type="text" id="title" value={title} onChange={handleTitleChange} required />
                    </FormField>
                     <FormField label="معرّف الرابط (Slug)*" htmlFor="slug">
                        <Input type="text" id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} required dir="ltr" />
                    </FormField>
                    <FormField label="المحتوى* (كل فقرة في سطر)" htmlFor="content">
                        <Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} rows={10} required></Textarea>
                    </FormField>
                    <FormField label="الصورة الرئيسية" htmlFor="imageFile">
                         <div className="flex items-center gap-4">
                            <div className="w-24 h-24 rounded-md bg-muted overflow-hidden relative">
                                {isProcessing ? (
                                    <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                                        <Loader2 className="animate-spin text-primary" />
                                    </div>
                                ) : preview && (
                                    <img src={preview} alt="Preview" className="w-full h-full object-cover" loading="lazy" />
                                )}
                            </div>
                            <Input type="file" id="imageFile" onChange={handleFileChange} accept="image/*" disabled={isProcessing} />
                        </div>
                    </FormField>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                         <FormField label="الكاتب" htmlFor="authorName">
                            <Input type="text" id="authorName" value={authorName} onChange={(e) => setAuthorName(e.target.value)} required />
                        </FormField>
                        <FormField label="الحالة" htmlFor="status">
                            <Select id="status" value={status} onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}>
                                <option value="draft">مسودة</option>
                                <option value="published">منشور</option>
                            </Select>
                        </FormField>
                    </div>
                </form>
        </Modal>
    );
};
