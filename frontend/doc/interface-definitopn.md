# Facebook Feed — Interface Definition (RADIO: I)

This document defines the transport API and reusable component APIs. The
shapes referenced below are defined in `data-model.md`; the requirements and
acceptance criteria are in `requirements.md`.

## 1. Transport Conventions

- Base path: `/api/v1`
- Content type: `application/json` unless stated otherwise.
- Timestamps: ISO 8601 UTC strings.
- Pagination: opaque cursor values; clients must not inspect or construct them.
- Default feed page size: 20; maximum page size: 50.
- Mutations for the current user are idempotent where possible.

### Error response

```ts
type ErrorResponse = {
  error: {
    code:
      | 'VALIDATION_ERROR'
      | 'UNAUTHORIZED'
      | 'FORBIDDEN'
      | 'NOT_FOUND'
      | 'CONFLICT'
      | 'RATE_LIMITED'
      | 'INTERNAL_ERROR';
    message: string;
    fieldErrors?: Record<string, string[]>;
    requestId?: string;
  };
};
```

The frontend maps `VALIDATION_ERROR` to fields, `FORBIDDEN` to an ownership
message, and transient `5xx`/network errors to retryable feedback.

## 2. Server API

| Operation | Request | Success |
|---|---|---|
| `GET /api/v1/feed?cursor=&limit=&sort=latest` | Query parameters optional on first page | `200 { data: Post[], pagination }` |
| `POST /api/v1/posts` | `CreatePostRequest` | `201 { data: Post }` |
| `GET /api/v1/posts/:postId` | Path `postId` | `200 { data: Post }` |
| `PATCH /api/v1/posts/:postId` | `UpdatePostRequest` | `200 { data: Post }` |
| `DELETE /api/v1/posts/:postId` | Path `postId` | `204 No Content` |
| `GET /api/v1/posts/:postId/comments?cursor=&limit=` | Query parameters optional on first page | `200 { data: Comment[], pagination }` |
| `POST /api/v1/posts/:postId/comments` | `CreateCommentRequest` | `201 { data: Comment }` |
| `PATCH /api/v1/comments/:commentId` | `UpdateCommentRequest` | `200 { data: Comment }` |
| `DELETE /api/v1/comments/:commentId` | Path `commentId` | `204 No Content` |
| `PUT /api/v1/posts/:postId/reaction` | `SetReactionRequest` | `200 { data: Post }` |
| `DELETE /api/v1/posts/:postId/reaction` | Path `postId` | `200 { data: Post }` |
| `PUT /api/v1/posts/:postId/bookmark` | Path `postId` | `200 { data: Post }` |
| `DELETE /api/v1/posts/:postId/bookmark` | Path `postId` | `200 { data: Post }` |
| `POST /api/v1/posts/:postId/share` | `SharePostRequest` | `201 { data: Post }` |

### Feed request example

```http
GET /api/v1/feed?limit=20&sort=latest
```

```json
{
  "data": [
    {
      "id": "post_123",
      "author": {
        "id": "user_1",
        "name": "Alex Morgan",
        "username": "alexm",
        "avatarUrl": null,
        "badges": ["author"]
      },
      "content": "Just shipped the revised component spec.",
      "attachments": [],
      "createdAt": "2026-10-17T18:30:00Z",
      "updatedAt": "2026-10-17T18:30:00Z",
      "privacy": "public",
      "stats": {
        "reactions": { "counts": { "like": 142 }, "total": 142 },
        "comments": 24,
        "shares": 18,
        "bookmarks": 45,
        "views": 3400
      },
      "viewer": {
        "reaction": "like",
        "bookmarked": false,
        "canEdit": true,
        "canDelete": true
      }
    }
  ],
  "pagination": { "nextCursor": "cursor_abc", "hasMore": true }
}
```

### Mutation rules

- A `PATCH` attachment list replaces the complete list. Omitting the field
  keeps the existing list.
- `POST` and `PATCH` return the canonical updated entity so the client can
  replace its cached copy without guessing counts.
- A post or comment belonging to another user returns `403 FORBIDDEN` for
  edit/delete operations.
- A duplicate reaction or bookmark request is safe to retry.
- Failed optimistic mutations return the prior entity in the client rollback
  snapshot; the server does not need to know about that snapshot.

## 3. Component APIs

```ts
type FeedProps = {
  posts: Post[];
  status: 'idle' | 'loading' | 'success' | 'error';
  hasMore: boolean;
  onLoadMore: () => void;
  onRetry: () => void;
};

type PostCardProps = {
  post: Post;
  onReact: (type: ReactionType) => Promise<void>;
  onRemoveReaction: () => Promise<void>;
  onReply: () => void;
  onShare: () => Promise<void>;
  onBookmark: () => Promise<void>;
  onEdit?: () => void;
  onDelete?: () => Promise<void>;
};

type MediaGalleryProps = {
  attachments: MediaAttachment[];
  onMediaClick?: (attachment: MediaAttachment) => void;
};

type CommentThreadProps = {
  postId: string;
  comments: Comment[];
  status: 'idle' | 'loading' | 'success' | 'error';
  hasMore: boolean;
  onLoadMore: () => void;
  onReply: (parentCommentId: string | null) => void;
  onReact: (commentId: string, type: ReactionType) => Promise<void>;
};

type CommentComposerProps = {
  parentCommentId: string | null;
  value: CommentComposerState;
  onChange: (next: CommentComposerState) => void;
  onSubmit: () => Promise<void>;
  onCancel: () => void;
};
```

Components emit intent through callbacks. They do not know whether the action
is implemented by a mock service, an HTTP client, or a future state library.

## 4. Interaction and Accessibility Contract

- Buttons expose accessible names such as “Like post,” “Reply to Alex,” and
  “Show 20 more comments.”
- Loading and mutation states disable only the affected action where possible.
- New comments are announced without moving keyboard focus unexpectedly.
- The media gallery exposes the selected image and its position to assistive
  technology.
- Error messages are associated with the relevant composer or action and
  include a retry path when the operation is recoverable.

