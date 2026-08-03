"use server";

import { contentService as apiContentService } from '@alrehla/api/services/contentService';
import type { UserRole } from '@alrehla/types';
import { z } from 'zod';
import {
  blogPostSchema,
  contentUploadFileSchema,
  numericIdListSchema,
  numericIdSchema,
  siteContentSchema,
} from '../lib/server/actionSchemas';
import {
  MARKETPLACE_ROLES,
  actionError,
  parseActionInput,
  revalidateMarketplaceTags,
  withMarketplaceAction,
} from '../lib/server/actionSecurity';
import { uploadSignedContentImage } from '../lib/server/cloudinaryUpload';
import { resolveStoredImageUrl } from '../lib/imageUrl';

const BLOG_EDITOR_ROLES = [
  ...MARKETPLACE_ROLES.databaseAdmins,
  'content_editor',
] as const satisfies readonly UserRole[];

export const getSiteContent = async () =>
  withMarketplaceAction(
    'content.getSiteContent',
    () => apiContentService.getSiteContent(),
    MARKETPLACE_ROLES.databaseAdmins,
  );

export const updateSiteContent = async (newContent: any) => {
  const input = parseActionInput(siteContentSchema, newContent);
  return withMarketplaceAction(
    'content.updateSiteContent',
    async () => {
      const result = await apiContentService.updateSiteContent(input as any);
      revalidateMarketplaceTags(
        'marketplace:site-content',
        'marketplace:public-data',
      );
      return result;
    },
    MARKETPLACE_ROLES.databaseAdmins,
  );
};

export const uploadFile = async (file: File) => {
  const input = parseActionInput(contentUploadFileSchema, file);
  return withMarketplaceAction(
    'content.uploadFile',
    (context) => uploadSignedContentImage(input, context.actor.id),
    BLOG_EDITOR_ROLES,
  );
};

export const getAllBlogPosts = async () =>
  withMarketplaceAction(
    'content.getAllBlogPosts',
    () => apiContentService.getAllBlogPosts(),
    BLOG_EDITOR_ROLES,
  );

export const createBlogPost = async (payload: any) => {
  const input = parseActionInput(blogPostSchema, payload) as {
    title: string;
    slug: string;
    content: string;
    image_url?: string | null;
    imageFile?: File;
    author_name: string;
    status: 'published' | 'draft';
    published_at?: string | null;
  };
  return withMarketplaceAction(
    'content.createBlogPost',
    async (context) => {
      const {
        id: _ignoredId,
        imageFile,
        image_url: currentImageUrl,
        ...newPost
      } = input as typeof input & {
        id?: number;
      };
      try {
        const uploadedAsset = imageFile
          ? await uploadSignedContentImage(imageFile, context.actor.id)
          : null;
        const imageUrl =
          uploadedAsset?.url ??
          (currentImageUrl === null
            ? null
            : resolveStoredImageUrl(currentImageUrl));
        if (currentImageUrl && !imageUrl) {
          actionError('رابط صورة المقال غير صالح.');
        }

        const result = await apiContentService.createBlogPost({
          ...newPost,
          ...(imageUrl !== undefined ? { image_url: imageUrl } : {}),
        });
        revalidateMarketplaceTags(
          'blog',
          `blog:${result.slug}`,
          'marketplace:blog-posts',
          'marketplace:public-data',
        );
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : '';
        if (message.includes('blog_posts_slug_key') || message.includes('duplicate')) {
          actionError('رابط المقال مستخدم بالفعل.');
        }
        throw error;
      }
    },
    BLOG_EDITOR_ROLES,
  );
};

export const updateBlogPost = async (payload: any) => {
  const input = parseActionInput(blogPostSchema, payload) as {
    id?: number;
    title: string;
    slug: string;
    content: string;
    image_url?: string | null;
    imageFile?: File;
    author_name: string;
    status: 'published' | 'draft';
    published_at?: string | null;
  };
  if (!input.id) actionError('معرف المقال مطلوب.');

  return withMarketplaceAction(
    'content.updateBlogPost',
    async (context) => {
      try {
        const {
          imageFile,
          image_url: currentImageUrl,
          ...updates
        } = input;
        const uploadedAsset = imageFile
          ? await uploadSignedContentImage(imageFile, context.actor.id)
          : null;
        const imageUrl =
          uploadedAsset?.url ??
          (currentImageUrl === null
            ? null
            : resolveStoredImageUrl(currentImageUrl));
        if (currentImageUrl && !imageUrl) {
          actionError('رابط صورة المقال غير صالح.');
        }

        const result = await apiContentService.updateBlogPost({
          ...updates,
          id: input.id!,
          ...(imageUrl !== undefined ? { image_url: imageUrl } : {}),
        });
        revalidateMarketplaceTags(
          'blog',
          `blog:${input.slug}`,
          `marketplace:blog-post:${input.id}`,
          'marketplace:blog-posts',
          'marketplace:public-data',
        );
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : '';
        if (message.includes('blog_posts_slug_key') || message.includes('duplicate')) {
          actionError('رابط المقال مستخدم بالفعل.');
        }
        throw error;
      }
    },
    BLOG_EDITOR_ROLES,
  );
};

export const deleteBlogPost = async (postId: number) => {
  const id = parseActionInput(numericIdSchema, postId);
  return withMarketplaceAction(
    'content.deleteBlogPost',
    async () => {
      const result = await apiContentService.deleteBlogPost(id);
      revalidateMarketplaceTags(
        'blog',
        'marketplace:blog-posts',
        'marketplace:public-data',
      );
      return result;
    },
    BLOG_EDITOR_ROLES,
  );
};

export const bulkUpdateBlogPostsStatus = async (
  postIds: number[],
  status: 'published' | 'draft',
) => {
  const ids = parseActionInput(numericIdListSchema, postIds);
  const nextStatus = parseActionInput(z.enum(['published', 'draft']), status);
  return withMarketplaceAction(
    'content.bulkUpdateBlogPostsStatus',
    async () => {
      const result = await apiContentService.bulkUpdateBlogPostsStatus(
        ids,
        nextStatus,
      );
      revalidateMarketplaceTags(
        'blog',
        'marketplace:blog-posts',
        'marketplace:public-data',
      );
      return result;
    },
    BLOG_EDITOR_ROLES,
  );
};

export const bulkDeleteBlogPosts = async (postIds: number[]) => {
  const ids = parseActionInput(numericIdListSchema, postIds);
  return withMarketplaceAction(
    'content.bulkDeleteBlogPosts',
    async () => {
      const result = await apiContentService.bulkDeleteBlogPosts(ids);
      revalidateMarketplaceTags(
        'blog',
        'marketplace:blog-posts',
        'marketplace:public-data',
      );
      return result;
    },
    BLOG_EDITOR_ROLES,
  );
};
