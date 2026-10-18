import type { CommentPage, FeedPage } from './api';
import type { MediaInput, Privacy } from './entities';

export type AsyncStatus =
  | 'idle'
  | 'loading'
  | 'submitting'
  | 'success'
  | 'error';

export type FeedState = {
  pages: FeedPage[];
  status: AsyncStatus;
  error: string | null;
  isRefreshing: boolean;
};

export type CommentState = {
  page: CommentPage | null;
  status: AsyncStatus;
  error: string | null;
};

export type PostComposerState = {
  content: string;
  attachments: MediaInput[];
  privacy: Privacy;
  status: AsyncStatus;
  error: string | null;
};

export type CommentComposerState = {
  postId: string;
  parentCommentId: string | null;
  content: string;
  attachments: MediaInput[];
  status: AsyncStatus;
  error: string | null;
};

