/** Values accepted by a post's visibility setting. */
export type Privacy = 'public' | 'friends' | 'only_me';

/** Reactions supported by posts and comments. */
export type ReactionType =
  | 'like'
  | 'love'
  | 'haha'
  | 'wow'
  | 'sad'
  | 'angry';

export type UserBadge =
  | 'author'
  | 'moderator'
  | 'staff'
  | 'verified'
  | 'pro';

export type User = {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  badges: UserBadge[];
};

/** A media item returned by the server after it has a stable ID. */
export type MediaAttachment = {
  id: string;
  type: 'image';
  url: string;
  altText: string;
  width: number | null;
  height: number | null;
};

/** Media submitted by the prototype before the server assigns an ID. */
export type MediaInput = {
  url: string;
  altText?: string;
};

export type ReactionSummary = {
  counts: Partial<Record<ReactionType, number>>;
  total: number;
};

export type PostStats = {
  reactions: ReactionSummary;
  comments: number;
  shares: number;
  bookmarks: number;
  views: number;
};

export type ViewerPostState = {
  reaction: ReactionType | null;
  bookmarked: boolean;
  canEdit: boolean;
  canDelete: boolean;
};

/** Complete post view model returned by the feed and post endpoints. */
export type Post = {
  id: string;
  author: User;
  content: string | null;
  attachments: MediaAttachment[];
  createdAt: string;
  updatedAt: string;
  privacy: Privacy;
  stats: PostStats;
  viewer: ViewerPostState;
};

export type CommentStats = {
  reactions: ReactionSummary;
  replies: number;
};

export type ViewerCommentState = {
  reaction: ReactionType | null;
  canEdit: boolean;
  canDelete: boolean;
};

/** A root comment or reply. `parentCommentId` identifies replies. */
export type Comment = {
  id: string;
  postId: string;
  parentCommentId: string | null;
  author: User;
  content: string | null;
  attachments: MediaAttachment[];
  createdAt: string;
  updatedAt: string;
  stats: CommentStats;
  viewer: ViewerCommentState;
};

