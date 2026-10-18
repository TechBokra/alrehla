import { Button } from '../../../components/ui';

export interface LoadMoreCommentsProps {
  hasMore: boolean;
  loading?: boolean;
  onLoadMore: () => void;
}

export function LoadMoreComments({
  hasMore,
  loading = false,
  onLoadMore
}: LoadMoreCommentsProps) {
  if (!hasMore) {
    return null;
  }

  return (
    <Button
      className="feature-load-more"
      disabled={loading}
      variant="outline"
      onClick={onLoadMore}
    >
      {loading ? 'Loading comments…' : 'Show more comments'}
    </Button>
  );
}

