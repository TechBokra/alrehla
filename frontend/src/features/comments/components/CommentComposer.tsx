import { Button, IconButton, Textarea } from '../../../components/ui';
import type { CommentComposerState } from '../../../types';

export interface CommentComposerProps {
  value: CommentComposerState;
  onChange: (next: CommentComposerState) => void;
  onSubmit: () => void | Promise<void>;
  onCancel: () => void;
}

export function CommentComposer({
  value,
  onChange,
  onSubmit,
  onCancel
}: CommentComposerProps) {
  const canSubmit =
    value.content.trim().length > 0 || value.attachments.length > 0;

  return (
    <form
      className="feature-comment-composer"
      onSubmit={(event) => {
        event.preventDefault();
        if (canSubmit) {
          void onSubmit();
        }
      }}
    >
      <Textarea
        aria-label="Comment text"
        value={value.content}
        disabled={value.status === 'submitting'}
        onChange={(event) =>
          onChange({ ...value, content: event.target.value })
        }
        placeholder="Reply to the post or mention someone with @…"
      />
      <div className="feature-composer-toolbar">
        <div className="feature-composer-tools" aria-label="Formatting tools">
          <IconButton label="Bold" size="sm" variant="ghost">
            <strong aria-hidden="true">B</strong>
          </IconButton>
          <IconButton label="Add link" size="sm" variant="ghost">
            <span aria-hidden="true">↗</span>
          </IconButton>
          <IconButton label="Add image" size="sm" variant="ghost">
            <span aria-hidden="true">▧</span>
          </IconButton>
          <IconButton label="Add emoji" size="sm" variant="ghost">
            <span aria-hidden="true">☺</span>
          </IconButton>
          <span className="feature-meta">
            {value.attachments.length} / 4 images
          </span>
        </div>
        <div className="feature-composer-actions">
          <Button size="sm" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            disabled={!canSubmit || value.status === 'submitting'}
            size="sm"
            type="submit"
          >
            {value.status === 'submitting' ? 'Replying…' : 'Reply'}
          </Button>
        </div>
      </div>
      {value.error && (
        <p className="feature-error" role="alert">
          {value.error}
        </p>
      )}
    </form>
  );
}

