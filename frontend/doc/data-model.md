# Facebook Feed — Data Model (RADIO: D)

This document is the canonical vocabulary for the feed. API responses,
fixtures, client state, and component props should reuse these shapes rather
than defining feature-specific alternatives.

## 1. Conventions

- IDs are opaque strings and must not be parsed by the client.
- Timestamps are ISO 8601 UTC strings.
- `null` means the value is intentionally absent; an empty array means there
  are currently no items.
- API payloads use camelCase.
- The prototype supports image URLs. A future upload flow can produce the same
  `MediaAttachment` shape after upload completes.

## 2. Shared Types

```ts
type Privacy = 'public' | 'friends' | 'only_me';

type ReactionType = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry';

type User = {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  badges: Array<'author' | 'moderator' | 'staff' | 'verified' | 'pro'>;
};

type MediaAttachment = {
  id: string;
  type: 'image';
  url: string;
  altText: string;
  width: number | null;
  height: number | null;
};

type MediaInput = {
  url: string;
  altText?: string;
};

type ReactionSummary = {
  counts: Partial<Record<ReactionType, number>>;
  total: number;
};
```

## 3. Server and View Models

The API returns a complete `Post` or `Comment` view model. A client store may
normalize users and posts internally, but component props should use these
stable shapes.

```ts
type PostStats = {
  reactions: ReactionSummary;
  comments: number;
  shares: number;
  bookmarks: number;
  views: number;
};

type ViewerPostState = {
  reaction: ReactionType | null;
  bookmarked: boolean;
  canEdit: boolean;
  canDelete: boolean;
};

type Post = {
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

type CommentStats = {
  reactions: ReactionSummary;
  replies: number;
};

type ViewerCommentState = {
  reaction: ReactionType | null;
  canEdit: boolean;
  canDelete: boolean;
};

type Comment = {
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

type Pagination = {
  nextCursor: string | null;
  hasMore: boolean;
};

type FeedPage = {
  data: Post[];
  pagination: Pagination;
};

type CommentPage = {
  data: Comment[];
  pagination: Pagination;
};
```

## 4. Request Models

```ts
type CreatePostRequest = {
  content?: string;
  attachments?: MediaInput[];
  privacy: Privacy;
};

type UpdatePostRequest = {
  content?: string;
  attachments?: MediaInput[]; // Replaces the complete selection.
  privacy?: Privacy;
};

type CreateCommentRequest = {
  content?: string;
  attachments?: MediaInput[];
  parentCommentId?: string | null;
};

type UpdateCommentRequest = {
  content?: string;
  attachments?: MediaInput[];
};

type SetReactionRequest = {
  type: ReactionType;
};

type SharePostRequest = {
  message?: string;
  privacy: Privacy;
};
```

## 5. Client UI State

```ts
type AsyncStatus = 'idle' | 'loading' | 'submitting' | 'success' | 'error';

type FeedState = {
  pages: FeedPage[];
  status: AsyncStatus;
  error: string | null;
  isRefreshing: boolean;
};

type PostComposerState = {
  content: string;
  attachments: MediaInput[];
  privacy: Privacy;
  status: AsyncStatus;
  error: string | null;
};

type CommentComposerState = {
  postId: string;
  parentCommentId: string | null;
  content: string;
  attachments: MediaInput[];
  status: AsyncStatus;
  error: string | null;
};
```

UI state is temporary and must not be persisted as a domain entity. In
particular, loading indicators, open menus, draft text, toast messages, and
optimistic snapshots do not belong on `Post` or `Comment`.

## 6. Invariants and Validation

- A post must contain trimmed text or at least one attachment.
- A post has at most 10 attachments.
- A comment/reply must contain trimmed text or at least one attachment.
- A comment/reply has at most 4 attachments, matching the wireframe composer.
- Empty strings are normalized to `null` before submission.
- Only `type: 'image'` attachments are accepted by the prototype.
- `UpdatePostRequest.attachments` replaces the complete image list; omission
  means “keep existing images.”
- `parentCommentId: null` creates a root comment; an ID creates a reply.
- `viewer.canEdit` and `viewer.canDelete` are derived from the predefined
  current user in the prototype and must not be trusted as authorization in a
  production server.

