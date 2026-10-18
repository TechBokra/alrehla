import type { MediaAttachment } from '../../../types';

export interface MediaGalleryProps {
  attachments: MediaAttachment[];
  onMediaClick?: (attachment: MediaAttachment) => void;
}

export function MediaGallery({
  attachments,
  onMediaClick
}: MediaGalleryProps) {
  if (attachments.length === 0) {
    return null;
  }

  return (
    <div
      className="feature-media-gallery"
      data-count={Math.min(attachments.length, 4)}
      role="group"
      aria-label={`${attachments.length} image${attachments.length === 1 ? '' : 's'}`}
    >
      {attachments.map((attachment, index) => (
        <button
          className="feature-media-item"
          disabled={!onMediaClick}
          key={attachment.id}
          type="button"
          onClick={() => onMediaClick?.(attachment)}
        >
          <img
            src={attachment.url}
            alt={attachment.altText}
            width={attachment.width ?? undefined}
            height={attachment.height ?? undefined}
            loading="lazy"
          />
          {attachments.length > 1 && (
            <span className="feature-media-count">
              {index + 1} / {attachments.length}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

