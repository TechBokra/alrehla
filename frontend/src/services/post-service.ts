import type {
  CreatePostRequest,
  DataResponse,
  Post,
  UpdatePostRequest
} from '../types';
import { apiClient, type ApiClient } from './api-client';

export interface PostService {
  get(postId: string): Promise<DataResponse<Post>>;
  create(request: CreatePostRequest): Promise<DataResponse<Post>>;
  update(
    postId: string,
    request: UpdatePostRequest
  ): Promise<DataResponse<Post>>;
  remove(postId: string): Promise<void>;
}

export function createPostService(client: ApiClient): PostService {
  return {
    get: (postId) => client.get<DataResponse<Post>>(`/api/v1/posts/${postId}`),
    create: (request) =>
      client.post<DataResponse<Post>>('/api/v1/posts', request),
    update: (postId, request) =>
      client.patch<DataResponse<Post>>(`/api/v1/posts/${postId}`, request),
    remove: (postId) => client.delete<void>(`/api/v1/posts/${postId}`)
  };
}

export const postService = createPostService(apiClient);
