import type { ChildProfile, UserProfile } from '@alrehla/types';

/**
 * Safe, request-scoped auth data that can cross the Server Component → client
 * provider boundary. It intentionally contains no Clerk tokens or session data.
 */
export interface AuthBootstrapState {
  /** Clerk subject used only to detect a session switch after hydration. */
  clerkUserId?: string;
  currentUser: UserProfile | null;
  currentChildProfile: ChildProfile | null;
  childProfiles: ChildProfile[];
}
