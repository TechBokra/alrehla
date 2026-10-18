import { Button, Card, CardContent } from '../../../components/ui';
import type { Post, ReactionType } from '../../../types';
import { PostCard } from '../../posts/components';

export type FeedPageStatus = 'idle' | 'loading' | 'success' | 'error';

export interface FeedPageProps {
  posts: Post[];
  status: FeedPageStatus;
  error?: string | null;
  hasMore: boolean;
  onLoadMore: () => void;
  onRetry?: () => void;
  onReact?: (
    postId: string,
    reaction: ReactionType | null
  ) => void | Promise<void>;
  onReply?: (postId: string) => void;
  onShare?: (postId: string) => void | Promise<void>;
  onBookmark?: (postId: string) => void | Promise<void>;
  onMenu?: (postId: string) => void;
  onMediaClick?: (postId: string, attachmentId: string) => void;
}

export function FeedPage({
  posts,
  status,
  error,
  hasMore,
  onLoadMore,
  onRetry,
  onReact,
  onReply,
  onShare,
  onBookmark,
  onMenu,
  onMediaClick
}: FeedPageProps) {
  if (status === 'loading' && posts.length === 0) {
    return (
      <Card className="feature-feed-state">
        <CardContent>
          <p className="feature-empty-state">Loading feed…</p>
        </CardContent>
      </Card>
    );
  }

  if (status === 'error' && posts.length === 0) {
    return (
      <Card className="feature-feed-state">
        <CardContent className="feature-error-state" role="alert">
          <p>{error ?? 'The feed could not be loaded.'}</p>
          {onRetry && (
            <Button variant="outline" onClick={onRetry}>
              Try again
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (status !== 'loading' && posts.length === 0) {
    return (
      <Card className="feature-feed-state">
        <CardContent>
          <p className="feature-empty-state">No posts yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="feature-feed" aria-label="Social feed">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onReact={
            onReact ? (reaction) => onReact(post.id, reaction) : undefined
          }
          onReply={onReply ? () => onReply(post.id) : undefined}
          onShare={onShare ? () => onShare(post.id) : undefined}
          onBookmark={onBookmark ? () => onBookmark(post.id) : undefined}
          onMenu={onMenu ? () => onMenu(post.id) : undefined}
          onMediaClick={
            onMediaClick
              ? (attachmentId) => onMediaClick(post.id, attachmentId)
              : undefined
          }
        />
      ))}
      {hasMore && (
        <Button
          className="feature-feed-load-more"
          disabled={status === 'loading'}
          variant="outline"
          onClick={onLoadMore}
        >
          {status === 'loading' ? 'Loading more posts…' : 'Load more posts'}
        </Button>
      )}
    </section>
  );
}

