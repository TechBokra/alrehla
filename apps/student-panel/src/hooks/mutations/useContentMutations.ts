
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../contexts/ToastContext';
import { contentService } from '../../services/contentService';
import type { SiteContent } from '../../lib/database.types';

export const useContentMutations = () => {
    const queryClient = useQueryClient();
    const { addToast } = useToast();

    const updateSiteContent = useMutation({
        mutationFn: contentService.updateSiteContent,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminSiteContent'] });
            queryClient.invalidateQueries({ queryKey: ['publicData'] });
            addToast('تم تحديث محتوى الموقع بنجاح.', 'success');
        },
        onError: (error: Error) => {
            addToast(`فشل تحديث المحتوى: ${error.message}`, 'error');
        }
    });
    
    const uploadFile = useMutation({
        mutationFn: contentService.uploadFile,
        onError: (error: Error) => {
             addToast(`فشل رفع الملف: ${error.message}`, 'error');
        }
    });

    const createBlogPost = useMutation({
        mutationFn: contentService.createBlogPost,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminBlogPosts'] });
            addToast('تم إنشاء المقال بنجاح.', 'success');
        },
        onError: (err: Error) => {
            let errorMessage = err.message;
            if (errorMessage.includes('blog_posts_slug_key')) {
                errorMessage = "عذراً، هذا العنوان أو الرابط مستخدم بالفعل في مقال آخر. يرجى تغيير العنوان قليلاً.";
            }
            addToast(`فشل إنشاء المقال: ${errorMessage}`, 'error');
        },
    });
    
    const updateBlogPost = useMutation({
        mutationFn: contentService.updateBlogPost,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminBlogPosts'] });
            addToast('تم تحديث المقال بنجاح.', 'success');
        },
        onError: (err: Error) => {
            let errorMessage = err.message;
            if (errorMessage.includes('blog_posts_slug_key')) {
                errorMessage = "عذراً، الرابط الجديد مستخدم في مقال آخر. يرجى اختيار رابط مختلف.";
            }
            addToast(`فشل تحديث المقال: ${errorMessage}`, 'error');
        },
    });

    const deleteBlogPost = useMutation({
        mutationFn: ({ postId }: { postId: number }) => contentService.deleteBlogPost(postId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminBlogPosts'] });
            addToast('تم حذف المقال بنجاح.', 'info');
        },
        onError: (err: Error) => addToast(`فشل حذف المقال: ${err.message}`, 'error'),
    });
    
    const bulkUpdateBlogPostsStatus = useMutation({
        mutationFn: ({ postIds, status }: { postIds: number[], status: 'published' | 'draft' }) => 
            contentService.bulkUpdateBlogPostsStatus(postIds, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminBlogPosts'] });
            addToast('تم تحديث حالة المقالات المحددة.', 'success');
        },
        onError: (error: Error) => addToast(`فشل تحديث الحالات: ${error.message}`, 'error'),
    });

    const bulkDeleteBlogPosts = useMutation({
        mutationFn: ({ postIds }: { postIds: number[] }) => contentService.bulkDeleteBlogPosts(postIds),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminBlogPosts'] });
            addToast('تم حذف المقالات المحددة.', 'info');
        },
        onError: (error: Error) => addToast(`فشل حذف المقالات: ${error.message}`, 'error'),
    });

    return { 
        updateSiteContent, 
        uploadFile, 
        createBlogPost, 
        updateBlogPost, 
        deleteBlogPost,
        bulkUpdateBlogPostsStatus,
        bulkDeleteBlogPosts
    };
};
