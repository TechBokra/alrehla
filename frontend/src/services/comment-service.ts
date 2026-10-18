import type {
  CommentPage,
  CommentQuery,
  CreateCommentRequest,
  DataResponse,
  Comment,
  UpdateCommentRequest
} from '../types';
import { apiClient, type ApiClient } from './api-client';

export interface CommentService {
  list(postId: string, query?: CommentQuery): Promise<CommentPage>;
  create(
    postId: string,
    request: CreateCommentRequest
  ): Promise<DataResponse<Comment>>;
  update(
    commentId: string,
    request: UpdateCommentRequest
  ): Promise<DataResponse<Comment>>;
  remove(commentId: string): Promise<void>;
}

function buildCommentsQuery(query: CommentQuery = {}): string {
  const params = new URLSearchParams();

  if (query.cursor) {
    params.set('cursor', query.cursor);
  }

  if (query.limit !== undefined) {
    params.set('limit', String(query.limit));
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

export function createCommentService(client: ApiClient): CommentService {
  return {
    list: (postId, query) =>
      client.get<CommentPage>(
        `/api/v1/posts/${postId}/comments${buildCommentsQuery(query)}`
      ),
    create: (postId, request) =>
      client.post<DataResponse<Comment>>(
        `/api/v1/posts/${postId}/comments`,
        request
      ),
    update: (commentId, request) =>
      client.patch<DataResponse<Comment>>(
        `/api/v1/comments/${commentId}`,
        request
      ),
    remove: (commentId) => client.delete<void>(`/api/v1/comments/${commentId}`)
  };
}

export const commentService = createCommentService(apiClient);
