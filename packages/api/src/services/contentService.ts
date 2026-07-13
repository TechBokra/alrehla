
import { supabase } from '../lib/supabaseClient';
import { cloudinaryService } from './cloudinaryService';
import { reportingService } from './reportingService';
import type { SiteContent, BlogPost } from '@alrehla/types';
import { mockSiteContent } from '@alrehla/config/mockData';

export const contentService = {
    // --- Site Content ---
    async getSiteContent() {
        const { data, error } = await supabase
            .from('site_settings')
            .select('value')
            .eq('key', 'global_content')
            .single();
        
        // AUTO-SEED LOGIC REMOVED
        // If content is missing in DB (error or empty), return null
        if (error || !data || !(data as any).value) {
            return null;
        }

        return (data as any).value as SiteContent;
    },

    async updateSiteContent(newContent: SiteContent) {
        const { data, error } = await (supabase.from('site_settings') as any)
            .upsert({ 
                key: 'global_content', 
                value: newContent,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw new Error(error.message);
        
        await reportingService.logAction('UPDATE_SITE_CONTENT', 'global', `محتوى الموقع`, `تحديث النصوص / الصور في صفحات المنصة`);
        return data.value as SiteContent;
    },

    async uploadFile(file: File): Promise<any> {
        const asset = await cloudinaryService.uploadImage(file, 'alrehla_content');
        return asset;
    },

    // --- Blog Posts ---
    async getAllBlogPosts() {
        const { data, error } = await supabase
            .from('blog_posts')
            .select('*')
            .is('deleted_at', null)
            .order('created_at', { ascending: false });
            
        if (error) throw new Error(error.message);
        return data as BlogPost[];
    },

    async createBlogPost(payload: any) {
        let imageUrl = payload.image_url;
        if (payload.imageFile) {
            const asset = await this.uploadFile(payload.imageFile);
            imageUrl = JSON.stringify(asset);
        }

        const { imageFile, ...dbPayload } = payload;
        const insertData = { 
            ...dbPayload, 
            image_url: imageUrl,
            created_at: new Date().toISOString()
        };

        const { data, error } = await (supabase.from('blog_posts') as any)
            .insert([insertData])
            .select()
            .single();

        if (error) throw new Error(error.message);
        
        await reportingService.logAction('CREATE_BLOG_POST', data.id.toString(), `مقال: ${data.title}`, `إنشاء مقال جديد في المدونة`);
        return data as BlogPost;
    },

    async updateBlogPost(payload: any) {
        let imageUrl = payload.image_url;
        if (payload.imageFile) {
            const asset = await this.uploadFile(payload.imageFile);
            imageUrl = JSON.stringify(asset);
        }

        const { id, imageFile, ...updates } = payload;
        const updateData = { ...updates, image_url: imageUrl };


        const { data, error } = await (supabase.from('blog_posts') as any)
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(error.message);
        
        await reportingService.logAction('UPDATE_BLOG_POST', id.toString(), `مقال: ${data.title}`, `تحديث محتوى المقال`);
        return data as BlogPost;
    },

    async deleteBlogPost(postId: number) {
        const { error } = await (supabase.from('blog_posts') as any)
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', postId);

        if (error) throw new Error(error.message);
        
        await reportingService.logAction('DELETE_BLOG_POST', postId.toString(), `مقال ID: ${postId}`, `حذف ناعم للمقال`);
        return { success: true };
    },

    async bulkUpdateBlogPostsStatus(postIds: number[], status: 'published' | 'draft') {
        const { error } = await (supabase.from('blog_posts') as any)
            .update({ status })
            .in('id', postIds);

        if (error) throw new Error(error.message);
        
        await reportingService.logAction('BULK_BLOG_STATUS', 'multiple', `${postIds.length} مقالات`, `تغيير الحالة مجمع إلى: ${status}`);
        return { success: true };
    },

    async bulkDeleteBlogPosts(postIds: number[]) {
        const { error } = await (supabase.from('blog_posts') as any)
            .update({ deleted_at: new Date().toISOString() })
            .in('id', postIds);

        if (error) throw new Error(error.message);
        
        await reportingService.logAction('BULK_BLOG_DELETE', 'multiple', `${postIds.length} مقالات`, `حذف مجمع للمقالات`);
        return { success: true };
    }
};
