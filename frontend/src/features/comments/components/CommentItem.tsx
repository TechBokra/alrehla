import type { ReactNode } from 'react';
import { Avatar, Button } from '../../../components/ui';
import type { Comment, ReactionType } from '../../../types';
import { MediaGallery } from '../../posts/components';
import { ReactionButton } from '../../interactions/components';

export interface CommentItemProps {
  comment: Comment;
  depth?: number;
  onReact?: (reaction: ReactionType | null) => void | Promise<void>;
  onReply?: () => void;
  onShare?: () => void | Promise<void>;
  children?: ReactNode;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function CommentItem({
  comment,
  depth = 0,
  onReact,
  onReply,
  onShare,
  children
}: CommentItemProps) {
  return (
    <article className="feature-comment" data-depth={Math.min(depth, 3)}>
      <div className="feature-comment-main">
        <Avatar
          src={comment.author.avatarUrl}
          alt={`${comment.author.name}'s avatar`}
          fallback={getInitials(comment.author.name)}
          size="sm"
        />
        <div className="feature-comment-body">
          <div className="feature-comment-heading">
            <strong>{comment.author.name}</strong>
            <span className="feature-meta">@{comment.author.username}</span>
          </div>
          {comment.content && <p className="feature-comment-copy">{comment.content}</p>}
          <MediaGallery attachments={comment.attachments} />
          <div className="feature-comment-actions">
            <ReactionButton
              reaction={comment.viewer.reaction}
              total={comment.stats.reactions.total}
              targetLabel="comment"
              disabled={!onReact}
              onToggle={onReact ?? (() => undefined)}
            />
            <Button
              aria-label={`Reply to ${comment.author.name}`}
              disabled={!onReply}
              size="sm"
              variant="ghost"
              onClick={onReply}
            >
              Reply
            </Button>
            <Button
              aria-label={`Share ${comment.author.name}'s comment`}
              disabled={!onShare}
              size="sm"
              variant="ghost"
              onClick={onShare}
            >
              Share
            </Button>
          </div>
        </div>
      </div>
      {children}
    </article>
  );
}

