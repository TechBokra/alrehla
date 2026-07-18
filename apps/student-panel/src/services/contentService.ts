import * as contentActions from '../actions/contentActions';

export const contentService = {
  getSiteContent: contentActions.getSiteContent,
  updateSiteContent: contentActions.updateSiteContent,
  uploadFile: contentActions.uploadFile,
  getAllBlogPosts: contentActions.getAllBlogPosts,
  createBlogPost: contentActions.createBlogPost,
  updateBlogPost: contentActions.updateBlogPost,
  deleteBlogPost: contentActions.deleteBlogPost,
  bulkUpdateBlogPostsStatus: contentActions.bulkUpdateBlogPostsStatus,
  bulkDeleteBlogPosts: contentActions.bulkDeleteBlogPosts,
};
