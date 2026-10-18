import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  CreatePostRequest,
  FeedPage,
  FeedQuery,
  Post,
  ReactionType,
  SharePostRequest,
  UpdatePostRequest
} from '../types';
import {
  feedService as defaultFeedService,
  interactionService as defaultInteractionService,
  postService as defaultPostService,
  type FeedService,
  type InteractionService,
  type PostService
} from '../services';
import { getControllerErrorMessage } from './controller-utils';

export type ControllerLoadStatus = 'idle' | 'loading' | 'success' | 'error';

export interface FeedControllerOptions {
  feedService?: FeedService;
  postService?: PostService;
  interactionService?: InteractionService;
  initialQuery?: FeedQuery;
}

export interface FeedControllerState {
  posts: Post[];
  status: ControllerLoadStatus;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  retry: () => Promise<void>;
  react: (postId: string, reaction: ReactionType | null) => Promise<void>;
  bookmark: (postId: string) => Promise<void>;
  share: (postId: string, request?: SharePostRequest) => Promise<void>;
  createPost: (request: CreatePostRequest) => Promise<Post | null>;
  updatePost: (
    postId: string,
    request: UpdatePostRequest
  ) => Promise<Post | null>;
  deletePost: (postId: string) => Promise<void>;
  incrementCommentCount: (postId: string) => void;
}

const DEFAULT_FEED_QUERY: FeedQuery = {
  limit: 20,
  sort: 'latest'
};

function replacePostInPages(pages: FeedPage[], post: Post): FeedPage[] {
  return pages.map((page) => ({
    ...page,
    data: page.data.map((item) => (item.id === post.id ? post : item))
  }));
}

function removePostFromPages(pages: FeedPage[], postId: string): FeedPage[] {
  return pages.map((page) => ({
    ...page,
    data: page.data.filter((post) => post.id !== postId)
  }));
}

function applyReaction(post: Post, reaction: ReactionType | null): Post {
  const currentReaction = post.viewer.reaction;

  if (currentReaction === reaction) {
    return post;
  }

  const counts = { ...post.stats.reactions.counts };

  if (currentReaction) {
    counts[currentReaction] = Math.max(
      0,
      (counts[currentReaction] ?? 0) - 1
    );
  }

  if (reaction) {
    counts[reaction] = (counts[reaction] ?? 0) + 1;
  }

  return {
    ...post,
    stats: {
      ...post.stats,
      reactions: {
        counts,
        total:
          post.stats.reactions.total -
          (currentReaction ? 1 : 0) +
          (reaction ? 1 : 0)
      }
    },
    viewer: { ...post.viewer, reaction }
  };
}

function applyBookmark(post: Post, bookmarked: boolean): Post {
  if (post.viewer.bookmarked === bookmarked) {
    return post;
  }

  return {
    ...post,
    stats: {
      ...post.stats,
      bookmarks: post.stats.bookmarks + (bookmarked ? 1 : -1)
    },
    viewer: { ...post.viewer, bookmarked }
  };
}

export function useFeedController(
  options: FeedControllerOptions = {}
): FeedControllerState {
  const feedAdapter = options.feedService ?? defaultFeedService;
  const postAdapter = options.postService ?? defaultPostService;
  const interactionAdapter =
    options.interactionService ?? defaultInteractionService;
  const initialQuery = options.initialQuery ?? DEFAULT_FEED_QUERY;

  const [pages, setPages] = useState<FeedPage[]>([]);
  const [status, setStatus] = useState<ControllerLoadStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const posts = useMemo(() => pages.flatMap((page) => page.data), [pages]);
  const lastPage = pages[pages.length - 1];
  const hasMore = lastPage?.pagination.hasMore ?? false;

  const loadInitial = useCallback(async (): Promise<void> => {
    setStatus('loading');
    setError(null);

    try {
      const page = await feedAdapter.list(initialQuery);
      setPages([page]);
      setStatus('success');
    } catch (requestError) {
      setStatus('error');
      setError(
        getControllerErrorMessage(requestError, 'The feed could not be loaded.')
      );
    }
  }, [feedAdapter, initialQuery]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  const loadMore = useCallback(async (): Promise<void> => {
    const currentPage = pages[pages.length - 1];

    if (
      !currentPage?.pagination.hasMore ||
      !currentPage.pagination.nextCursor ||
      status === 'loading'
    ) {
      return;
    }

    setStatus('loading');
    setError(null);

    try {
      const page = await feedAdapter.list({
        ...initialQuery,
        cursor: currentPage.pagination.nextCursor
      });
      setPages((currentPages) => [...currentPages, page]);
      setStatus('success');
    } catch (requestError) {
      setStatus('error');
      setError(
        getControllerErrorMessage(
          requestError,
          'More posts could not be loaded.'
        )
      );
    }
  }, [feedAdapter, initialQuery, pages, status]);

  const replacePost = useCallback((post: Post): void => {
    setPages((currentPages) => replacePostInPages(currentPages, post));
  }, []);

  const react = useCallback(
    async (postId: string, reaction: ReactionType | null): Promise<void> => {
      const currentPost = posts.find((post) => post.id === postId);

      if (!currentPost) {
        return;
      }

      try {
        const response = reaction
          ? await interactionAdapter.setPostReaction(postId, { type: reaction })
          : await interactionAdapter.removePostReaction(postId);
        const returnedPost =
          response.data.id === postId ? response.data : currentPost;
        replacePost(applyReaction(returnedPost, reaction));
        setError(null);
      } catch (requestError) {
        setError(
          getControllerErrorMessage(requestError, 'Reaction could not be saved.')
        );
      }
    },
    [interactionAdapter, posts, replacePost]
  );

  const bookmark = useCallback(
    async (postId: string): Promise<void> => {
      const post = posts.find((item) => item.id === postId);

      if (!post) {
        return;
      }

      try {
        const response = post.viewer.bookmarked
          ? await interactionAdapter.removePostBookmark(postId)
          : await interactionAdapter.bookmarkPost(postId);
        const returnedPost =
          response.data.id === postId ? response.data : post;
        replacePost(applyBookmark(returnedPost, !post.viewer.bookmarked));
        setError(null);
      } catch (requestError) {
        setError(
          getControllerErrorMessage(requestError, 'Bookmark could not be saved.')
        );
      }
    },
    [interactionAdapter, posts, replacePost]
  );

  const share = useCallback(
    async (
      postId: string,
      request: SharePostRequest = { privacy: 'public' }
    ): Promise<void> => {
      try {
        const response = await interactionAdapter.sharePost(postId, request);
        const previousPost = posts.find((post) => post.id === postId);
        const returnedPost =
          previousPost && response.data.id !== postId
            ? previousPost
            : response.data;
        const sharedPost = previousPost
          ? {
              ...returnedPost,
              stats: {
                ...returnedPost.stats,
                shares: Math.max(
                  returnedPost.stats.shares,
                  previousPost.stats.shares + 1
                )
              }
            }
          : response.data;
        replacePost(sharedPost);
        setError(null);
      } catch (requestError) {
        setError(
          getControllerErrorMessage(requestError, 'The post could not be shared.')
        );
      }
    },
    [interactionAdapter, posts, replacePost]
  );

  const createPost = useCallback(
    async (request: CreatePostRequest): Promise<Post | null> => {
      try {
        const response = await postAdapter.create(request);
        setPages((currentPages) => {
          if (currentPages.length === 0) {
            return [
              {
                data: [response.data],
                pagination: { nextCursor: null, hasMore: false }
              }
            ];
          }

          const [firstPage, ...remainingPages] = currentPages;
          return [{ ...firstPage, data: [response.data, ...firstPage.data] }, ...remainingPages];
        });
        setError(null);
        return response.data;
      } catch (requestError) {
        setError(
          getControllerErrorMessage(requestError, 'The post could not be created.')
        );
        return null;
      }
    },
    [postAdapter]
  );

  const updatePost = useCallback(
    async (
      postId: string,
      request: UpdatePostRequest
    ): Promise<Post | null> => {
      try {
        const response = await postAdapter.update(postId, request);
        replacePost(response.data);
        setError(null);
        return response.data;
      } catch (requestError) {
        setError(
          getControllerErrorMessage(requestError, 'The post could not be updated.')
        );
        return null;
      }
    },
    [postAdapter, replacePost]
  );

  const deletePost = useCallback(
    async (postId: string): Promise<void> => {
      try {
        await postAdapter.remove(postId);
        setPages((currentPages) => removePostFromPages(currentPages, postId));
        setError(null);
      } catch (requestError) {
        setError(
          getControllerErrorMessage(requestError, 'The post could not be deleted.')
        );
      }
    },
    [postAdapter]
  );

  const incrementCommentCount = useCallback((postId: string): void => {
    setPages((currentPages) =>
      currentPages.map((page) => ({
        ...page,
        data: page.data.map((post) =>
          post.id === postId
            ? { ...post, stats: { ...post.stats, comments: post.stats.comments + 1 } }
            : post
        )
      }))
    );
  }, []);

  return {
    posts,
    status,
    error,
    hasMore,
    loadMore,
    retry: loadInitial,
    react,
    bookmark,
    share,
    createPost,
    updatePost,
    deletePost,
    incrementCommentCount
  };
}
