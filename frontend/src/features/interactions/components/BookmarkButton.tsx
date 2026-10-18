import { Button } from '../../../components/ui';

export interface BookmarkButtonProps {
  bookmarked: boolean;
  disabled?: boolean;
  onToggle: () => void | Promise<void>;
}

export function BookmarkButton({
  bookmarked,
  disabled = false,
  onToggle
}: BookmarkButtonProps) {
  return (
    <Button
      aria-pressed={bookmarked}
      aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark post'}
      disabled={disabled}
      size="sm"
      variant={bookmarked ? 'secondary' : 'ghost'}
      onClick={onToggle}
    >
      <span aria-hidden="true">{bookmarked ? '▣' : '□'}</span>
      {bookmarked ? 'Saved' : 'Save'}
    </Button>
  );
}

