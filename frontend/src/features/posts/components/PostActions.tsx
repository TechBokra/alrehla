import { Button } from '../../../components/ui';
import type { Post, ReactionType } from '../../../types';
import {
  BookmarkButton,
  ReactionButton,
  ShareButton
} from '../../interactions/components';

export interface PostActionsProps {
  post: Post;
  onReact?: (reaction: ReactionType | null) => void | Promise<void>;
  onReply?: () => void;
  onShare?: () => void | Promise<void>;
  onBookmark?: () => void | Promise<void>;
}

export function PostActions({
  post,
  onReact,
  onReply,
  onShare,
  onBookmark
}: PostActionsProps) {
  return (
    <div className="feature-post-actions">
      <ReactionButton
        reaction={post.viewer.reaction}
        total={post.stats.reactions.total}
        disabled={!onReact}
        onToggle={onReact ?? (() => undefined)}
        targetLabel="post"
      />
      <Button
        aria-label={`Reply to ${post.author.name}'s post`}
        disabled={!onReply}
        size="sm"
        variant="ghost"
        onClick={onReply}
      >
        <span aria-hidden="true">□</span>
        Reply {post.stats.comments}
      </Button>
      <ShareButton disabled={!onShare} onShare={onShare ?? (() => undefined)} />
      <BookmarkButton
        bookmarked={post.viewer.bookmarked}
        disabled={!onBookmark}
        onToggle={onBookmark ?? (() => undefined)}
      />
    </div>
  );
}

