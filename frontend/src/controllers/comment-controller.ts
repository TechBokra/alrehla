import { useCallback, useEffect, useState } from 'react';
import type {
  Comment,
  CommentPage,
  CreateCommentRequest,
  UpdateCommentRequest
} from '../types';
import {
  commentService as defaultCommentService,
  type CommentService
} from '../services';
import { getControllerErrorMessage } from './controller-utils';
import type { ControllerLoadStatus } from './feed-controller';

export interface CommentControllerOptions {
  commentService?: CommentService;
  pageSize?: number;
}

export interface CommentControllerState {
  comments: Comment[];
  status: ControllerLoadStatus;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  retry: () => Promise<void>;
  createComment: (request: CreateCommentRequest) => Promise<Comment | null>;
  updateComment: (
    commentId: string,
    request: UpdateCommentRequest
  ) => Promise<Comment | null>;
  deleteComment: (commentId: string) => Promise<void>;
}

function replaceComment(comments: Comment[], nextComment: Comment): Comment[] {
  return comments.map((comment) =>
    comment.id === nextComment.id ? nextComment : comment
  );
}

function removeCommentTree(comments: Comment[], commentId: string): Comment[] {
  const removedIds = new Set<string>([commentId]);
  let changed = true;

  while (changed) {
    changed = false;

    for (const comment of comments) {
      if (
        comment.parentCommentId &&
        removedIds.has(comment.parentCommentId) &&
        !removedIds.has(comment.id)
      ) {
        removedIds.add(comment.id);
        changed = true;
      }
    }
  }

  return comments.filter((comment) => !removedIds.has(comment.id));
}

export function useCommentController(
  postId: string | null,
  options: CommentControllerOptions = {}
): CommentControllerState {
  const commentAdapter = options.commentService ?? defaultCommentService;
  const pageSize = options.pageSize ?? 20;
  const [pages, setPages] = useState<CommentPage[]>([]);
  const [status, setStatus] = useState<ControllerLoadStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const comments = pages.flatMap((page) => page.data);
  const lastPage = pages[pages.length - 1];
  const hasMore = lastPage?.pagination.hasMore ?? false;

  const loadInitial = useCallback(async (): Promise<void> => {
    if (!postId) {
      setPages([]);
      setStatus('idle');
      setError(null);
      return;
    }

    setStatus('loading');
    setError(null);

    try {
      const page = await commentAdapter.list(postId, { limit: pageSize });
      setPages([page]);
      setStatus('success');
    } catch (requestError) {
      setStatus('error');
      setError(
        getControllerErrorMessage(
          requestError,
          'Comments could not be loaded.'
        )
      );
    }
  }, [commentAdapter, pageSize, postId]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  const loadMore = useCallback(async (): Promise<void> => {
    const currentPage = pages[pages.length - 1];

    if (
      !postId ||
      !currentPage?.pagination.hasMore ||
      !currentPage.pagination.nextCursor ||
      status === 'loading'
    ) {
      return;
    }

    setStatus('loading');
    setError(null);

    try {
      const page = await commentAdapter.list(postId, {
        cursor: currentPage.pagination.nextCursor,
        limit: pageSize
      });
      setPages((currentPages) => [...currentPages, page]);
      setStatus('success');
    } catch (requestError) {
      setStatus('error');
      setError(
        getControllerErrorMessage(
          requestError,
          'More comments could not be loaded.'
        )
      );
    }
  }, [commentAdapter, pageSize, pages, postId, status]);

  const createComment = useCallback(
    async (request: CreateCommentRequest): Promise<Comment | null> => {
      if (!postId) {
        setError('Select a post before adding a comment.');
        return null;
      }

      setStatus('loading');
      setError(null);

      try {
        const response = await commentAdapter.create(postId, request);
        const createdComment =
          response.data.postId === postId
            ? response.data
            : {
                ...response.data,
                postId,
                parentCommentId: request.parentCommentId ?? null,
                content: request.content?.trim() || response.data.content
              };
        setPages((currentPages) => {
          if (currentPages.length === 0) {
            return [
              {
                data: [createdComment],
                pagination: { nextCursor: null, hasMore: false }
              }
            ];
          }

          const [firstPage, ...remainingPages] = currentPages;
          const existing = firstPage.data.some(
            (comment) => comment.id === createdComment.id
          );
          const data = existing
            ? replaceComment(firstPage.data, createdComment)
            : [...firstPage.data, createdComment];

          return [{ ...firstPage, data }, ...remainingPages];
        });
        setStatus('success');
        return createdComment;
      } catch (requestError) {
        setStatus('error');
        setError(
          getControllerErrorMessage(
            requestError,
            'The comment could not be created.'
          )
        );
        return null;
      }
    },
    [commentAdapter, postId]
  );

  const updateComment = useCallback(
    async (
      commentId: string,
      request: UpdateCommentRequest
    ): Promise<Comment | null> => {
      try {
        const response = await commentAdapter.update(commentId, request);
        setPages((currentPages) =>
          currentPages.map((page) => ({
            ...page,
            data: replaceComment(page.data, response.data)
          }))
        );
        setError(null);
        return response.data;
      } catch (requestError) {
        setError(
          getControllerErrorMessage(
            requestError,
            'The comment could not be updated.'
          )
        );
        return null;
      }
    },
    [commentAdapter]
  );

  const deleteComment = useCallback(
    async (commentId: string): Promise<void> => {
      try {
        await commentAdapter.remove(commentId);
        setPages((currentPages) =>
          currentPages.map((page) => ({
            ...page,
            data: removeCommentTree(page.data, commentId)
          }))
        );
        setError(null);
      } catch (requestError) {
        setError(
          getControllerErrorMessage(
            requestError,
            'The comment could not be deleted.'
          )
        );
      }
    },
    [commentAdapter]
  );

  return {
    comments,
    status,
    error,
    hasMore,
    loadMore,
    retry: loadInitial,
    createComment,
    updateComment,
    deleteComment
  };
}
