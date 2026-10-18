import { useEffect, useState } from "react";
import { useCommentController, useFeedController } from "./controllers";
import { CommentThread } from "./features/comments/components";
import { FeedPage } from "./features/feed/components";
import type { CommentComposerState } from "./types";

const emptyComposer: CommentComposerState = {
  postId: "",
  parentCommentId: null,
  content: "",
  attachments: [],
  status: "idle",
  error: null,
};

function App() {
  const feed = useFeedController();
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const threadPostId = selectedPostId ?? feed.posts[0]?.id ?? null;
  const comments = useCommentController(threadPostId);
  const [composer, setComposer] = useState<CommentComposerState>(emptyComposer);

  useEffect(() => {
    if (!composer.postId && threadPostId) {
      setComposer((current) => ({ ...current, postId: threadPostId }));
    }
  }, [composer.postId, threadPostId]);

  function handleReply(postId: string): void {
    setSelectedPostId(postId);
    setComposer((current) => ({
      ...current,
      postId,
      parentCommentId: null,
      error: null,
    }));
  }

  function handleCommentReply(commentId: string): void {
    const comment = comments.comments.find((item) => item.id === commentId);

    if (!comment) {
      return;
    }

    setSelectedPostId(comment.postId);
    setComposer((current) => ({
      ...current,
      postId: comment.postId,
      parentCommentId: comment.id,
      error: null,
    }));
  }

  return (
    <main className="feed-demo-page">
      <section className="feed-demo-main">
        <FeedPage
          posts={feed.posts}
          status={feed.status}
          error={feed.error}
          hasMore={feed.hasMore}
          onLoadMore={() => void feed.loadMore()}
          onRetry={() => void feed.retry()}
          onReact={feed.react}
          onReply={handleReply}
          onShare={feed.share}
          onBookmark={feed.bookmark}
        />
      </section>

      <section className="feed-demo-comments" aria-label="Post comments">
        <div className="feed-demo-section-heading">
          <div>
            <p className="feed-demo-eyebrow">POST THREAD</p>
            <h2>Comments and replies</h2>
          </div>
          <span className="feed-demo-count">
            {comments.comments.length} loaded
          </span>
        </div>
        <CommentThread
          comments={comments.comments}
          status={comments.status}
          error={comments.error}
          hasMore={comments.hasMore}
          onLoadMore={() => void comments.loadMore()}
          onRetry={() => void comments.retry()}
          onReply={handleCommentReply}
        />
      </section>
    </main>
  );
}

export default App;
