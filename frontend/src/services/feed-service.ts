import type { FeedPage, FeedQuery } from '../types';
import { apiClient, type ApiClient } from './api-client';

export interface FeedService {
  list(query?: FeedQuery): Promise<FeedPage>;
}

function buildFeedQuery(query: FeedQuery = {}): string {
  const params = new URLSearchParams();

  if (query.cursor) {
    params.set('cursor', query.cursor);
  }

  if (query.limit !== undefined) {
    params.set('limit', String(query.limit));
  }

  if (query.sort) {
    params.set('sort', query.sort);
  }

  const queryString = params.toString();
  return queryString ? `/api/v1/feed?${queryString}` : '/api/v1/feed';
}

export function createFeedService(client: ApiClient): FeedService {
  return {
    list: (query) => client.get<FeedPage>(buildFeedQuery(query))
  };
}

export const feedService = createFeedService(apiClient);
