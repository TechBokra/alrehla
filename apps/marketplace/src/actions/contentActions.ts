"use server";

import { contentService as apiContentService } from '@alrehla/api/services/contentService';

export const getSiteContent = async () => {
  return apiContentService.getSiteContent();
};

export const updateSiteContent = async (newContent: any) => {
  return apiContentService.updateSiteContent(newContent);
};

export const uploadFile = async (file: File) => {
  return apiContentService.uploadFile(file);
};

export const getAllBlogPosts = async () => {
  return apiContentService.getAllBlogPosts();
};

export const createBlogPost = async (payload: any) => {
  return apiContentService.createBlogPost(payload);
};

export const updateBlogPost = async (payload: any) => {
  return apiContentService.updateBlogPost(payload);
};

export const deleteBlogPost = async (postId: number) => {
  return apiContentService.deleteBlogPost(postId);
};

export const bulkUpdateBlogPostsStatus = async (postIds: number[], status: 'published' | 'draft') => {
  return apiContentService.bulkUpdateBlogPostsStatus(postIds, status);
};

export const bulkDeleteBlogPosts = async (postIds: number[]) => {
  return apiContentService.bulkDeleteBlogPosts(postIds);
};
