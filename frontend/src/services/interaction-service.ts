import type {
  DataResponse,
  Post,
  SetReactionRequest,
  SharePostRequest
} from '../types';
import { apiClient, type ApiClient } from './api-client';

export interface InteractionService {
  setPostReaction(
    postId: string,
    request: SetReactionRequest
  ): Promise<DataResponse<Post>>;
  removePostReaction(postId: string): Promise<DataResponse<Post>>;
  bookmarkPost(postId: string): Promise<DataResponse<Post>>;
  removePostBookmark(postId: string): Promise<DataResponse<Post>>;
  sharePost(
    postId: string,
    request: SharePostRequest
  ): Promise<DataResponse<Post>>;
}

export function createInteractionService(
  client: ApiClient
): InteractionService {
  return {
    setPostReaction: (postId, request) =>
      client.put<DataResponse<Post>>(
        `/api/v1/posts/${postId}/reaction`,
        request
      ),
    removePostReaction: (postId) =>
      client.delete<DataResponse<Post>>(`/api/v1/posts/${postId}/reaction`),
    bookmarkPost: (postId) =>
      client.put<DataResponse<Post>>(`/api/v1/posts/${postId}/bookmark`),
    removePostBookmark: (postId) =>
      client.delete<DataResponse<Post>>(`/api/v1/posts/${postId}/bookmark`),
    sharePost: (postId, request) =>
      client.post<DataResponse<Post>>(`/api/v1/posts/${postId}/share`, request)
  };
}

export const interactionService = createInteractionService(apiClient);
