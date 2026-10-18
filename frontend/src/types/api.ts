import type {
  Comment,
  MediaInput,
  Post,
  Privacy,
  ReactionType
} from './entities';

export type Pagination = {
  nextCursor: string | null;
  hasMore: boolean;
};

export type FeedPage = {
  data: Post[];
  pagination: Pagination;
};

export type CommentPage = {
  data: Comment[];
  pagination: Pagination;
};

export type FeedSort = 'latest';

export type FeedQuery = {
  cursor?: string;
  limit?: number;
  sort?: FeedSort;
};

export type CommentQuery = {
  cursor?: string;
  limit?: number;
};

export type CreatePostRequest = {
  content?: string;
  attachments?: MediaInput[];
  privacy: Privacy;
};

export type UpdatePostRequest = {
  content?: string;
  /** Replaces the complete image selection when provided. */
  attachments?: MediaInput[];
  privacy?: Privacy;
};

export type CreateCommentRequest = {
  content?: string;
  attachments?: MediaInput[];
  parentCommentId?: string | null;
};

export type UpdateCommentRequest = {
  content?: string;
  attachments?: MediaInput[];
};

export type SetReactionRequest = {
  type: ReactionType;
};

export type SharePostRequest = {
  message?: string;
  privacy: Privacy;
};

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR';

export type ErrorResponse = {
  error: {
    code: ApiErrorCode;
    message: string;
    fieldErrors?: Record<string, string[]>;
    requestId?: string;
  };
};

export type DataResponse<T> = {
  data: T;
};

