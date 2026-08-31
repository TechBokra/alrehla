import type { ChildProfile, UserProfile } from '@alrehla/types';

export interface ClerkProfileInput {
  email: string;
  name: string;
}

export type AdminProfile = UserProfile;
export type StudentProfile = ChildProfile;

