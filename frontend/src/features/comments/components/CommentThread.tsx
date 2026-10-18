import { Button, Card, CardContent } from '../../../components/ui';
import type { Comment, ReactionType } from '../../../types';
import { CommentItem } from './CommentItem';
import { LoadMoreComments } from './LoadMoreComments';

export type CommentThreadStatus = 'idle' | 'loading' | 'success' | 'error';

export interface CommentThreadProps {
  comments: Comment[];
  status: CommentThreadStatus;
  error?: string | null;
  hasMore: boolean;
  onLoadMore: () => void;
  onRetry?: () => void;
  onReply?: (commentId: string) => void;
  onReact?: (
    commentId: string,
    reaction: ReactionType | null
  ) => void | Promise<void>;
  onShare?: (commentId: string) => void | Promise<void>;
}

export function CommentThread({
  comments,
  status,
  error,
  hasMore,
  onLoadMore,
  onRetry,
  onReply,
  onReact,
  onShare
}: CommentThreadProps) {
  const repliesByParent = new Map<string, Comment[]>();
  const roots: Comment[] = [];

  for (const comment of comments) {
    if (comment.parentCommentId === null) {
      roots.push(comment);
      continue;
    }

    const replies = repliesByParent.get(comment.parentCommentId) ?? [];
    replies.push(comment);
    repliesByParent.set(comment.parentCommentId, replies);
  }

  function renderComment(comment: Comment, depth = 0) {
    const replies = repliesByParent.get(comment.id) ?? [];

    return (
      <CommentItem
        comment={comment}
        depth={depth}
        key={comment.id}
        onReact={
          onReact
            ? (reaction) => onReact(comment.id, reaction)
            : undefined
        }
        onReply={onReply ? () => onReply(comment.id) : undefined}
        onShare={onShare ? () => onShare(comment.id) : undefined}
      >
        {replies.map((reply) => renderComment(reply, depth + 1))}
      </CommentItem>
    );
  }

  return (
    <Card className="feature-comment-thread">
      <CardContent>
        {status === 'loading' && comments.length === 0 && (
          <p className="feature-empty-state">Loading comments…</p>
        )}
        {status === 'error' && comments.length === 0 && (
          <div className="feature-error-state" role="alert">
            <p>{error ?? 'Comments could not be loaded.'}</p>
            {onRetry && (
              <Button variant="outline" onClick={onRetry}>
                Try again
              </Button>
            )}
          </div>
        )}
        {status !== 'loading' && comments.length === 0 && !error && (
          <p className="feature-empty-state">No comments yet.</p>
        )}
        <div className="feature-comment-list">
          {roots.map((comment) => renderComment(comment))}
        </div>
        <LoadMoreComments
          hasMore={hasMore}
          loading={status === 'loading'}
          onLoadMore={onLoadMore}
        />
      </CardContent>
    </Card>
  );
}
