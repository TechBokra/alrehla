import type { ReactNode } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '../../../components/ui';
import type { Post, ReactionType } from '../../../types';
import { MediaGallery } from './MediaGallery';
import { PostActions, type PostActionsProps } from './PostActions';
import { PostHeader } from './PostHeader';

export interface PostCardProps
  extends Omit<PostActionsProps, 'post'> {
  post: Post;
  onMenu?: () => void;
  onMediaClick?: (attachmentId: string) => void;
  onEdit?: () => void;
  onDelete?: () => void | Promise<void>;
  children?: ReactNode;
  className?: string;
  onReact?: (reaction: ReactionType | null) => void | Promise<void>;
}

export function PostCard({
  post,
  onMenu,
  onMediaClick,
  onReact,
  onReply,
  onShare,
  onBookmark,
  children,
  className
}: PostCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <PostHeader
          author={post.author}
          createdAt={post.createdAt}
          updatedAt={post.updatedAt}
          privacy={post.privacy}
          onMenu={onMenu}
        />
      </CardHeader>
      <CardContent className="feature-post-content">
        {post.content && <p className="feature-post-copy">{post.content}</p>}
        <MediaGallery
          attachments={post.attachments}
          onMediaClick={
            onMediaClick
              ? (attachment) => onMediaClick(attachment.id)
              : undefined
          }
        />
        <div className="feature-post-stats" aria-label="Post statistics">
          <span>{post.stats.reactions.total} reactions</span>
          <span>{post.stats.comments} comments</span>
          <span>{post.stats.shares} shares</span>
          <span>{post.stats.bookmarks} bookmarks</span>
        </div>
      </CardContent>
      <CardFooter className="feature-post-footer">
        <PostActions
          post={post}
          onReact={onReact}
          onReply={onReply}
          onShare={onShare}
          onBookmark={onBookmark}
        />
      </CardFooter>
      {children}
    </Card>
  );
}

