import { Avatar, IconButton } from '../../../components/ui';
import type { Privacy, User } from '../../../types';

export interface PostHeaderProps {
  author: User;
  createdAt: string;
  updatedAt: string;
  privacy: Privacy;
  onMenu?: () => void;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function formatTimestamp(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.valueOf())) {
    return value;
  }

  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

function getPrivacyLabel(privacy: Privacy): string {
  return privacy === 'only_me' ? 'Only me' : privacy[0].toUpperCase() + privacy.slice(1);
}

export function PostHeader({
  author,
  createdAt,
  updatedAt,
  privacy,
  onMenu
}: PostHeaderProps) {
  const edited = updatedAt !== createdAt;

  return (
    <div className="feature-post-header">
      <div className="feature-author">
        <Avatar
          src={author.avatarUrl}
          alt={`${author.name}'s avatar`}
          fallback={getInitials(author.name)}
        />
        <div>
          <div className="feature-author-line">
            <strong>{author.name}</strong>
            {author.badges.map((badge) => (
              <span className="feature-badge" key={badge}>
                {badge}
              </span>
            ))}
          </div>
          <p className="feature-meta">
            @{author.username} · {formatTimestamp(createdAt)}
            {edited ? ' · Edited' : ''} · {getPrivacyLabel(privacy)}
          </p>
        </div>
      </div>
      <IconButton
        label={`More actions for ${author.name}'s post`}
        variant="ghost"
        size="sm"
        onClick={onMenu}
        disabled={!onMenu}
      >
        <span aria-hidden="true">⋯</span>
      </IconButton>
    </div>
  );
}

