import { Button } from '../../../components/ui';
import type { ReactionType } from '../../../types';

export interface ReactionButtonProps {
  reaction: ReactionType | null;
  total: number;
  targetLabel: string;
  disabled?: boolean;
  onToggle: (reaction: ReactionType | null) => void | Promise<void>;
}

export function ReactionButton({
  reaction,
  total,
  targetLabel,
  disabled = false,
  onToggle
}: ReactionButtonProps) {
  const liked = reaction === 'like';

  return (
    <Button
      aria-pressed={liked}
      aria-label={`${liked ? 'Remove like from' : 'Like'} ${targetLabel}`}
      disabled={disabled}
      size="sm"
      variant={liked ? 'secondary' : 'ghost'}
      onClick={() => onToggle(liked ? null : 'like')}
    >
      <span aria-hidden="true">{liked ? '♥' : '♡'}</span>
      {total}
    </Button>
  );
}

