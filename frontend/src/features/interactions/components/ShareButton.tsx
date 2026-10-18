import { Button } from '../../../components/ui';

export interface ShareButtonProps {
  disabled?: boolean;
  onShare: () => void | Promise<void>;
}

export function ShareButton({ disabled = false, onShare }: ShareButtonProps) {
  return (
    <Button
      aria-label="Share post"
      disabled={disabled}
      size="sm"
      variant="ghost"
      onClick={onShare}
    >
      <span aria-hidden="true">↗</span>
      Share
    </Button>
  );
}

