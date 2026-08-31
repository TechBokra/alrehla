import type { ChildProfile, UserProfile } from '@alrehla/types';

/** Admin-facing row; components never need to understand Supabase relationships. */
export interface AdminUserRow extends UserProfile {
  activeStudentsCount: number;
  totalChildrenCount: number;
  isActuallyParent: boolean;
  children: ChildProfile[];
  parentName?: string;
  parentEmail?: string;
  relatedChildName?: string;
}

export interface AdminUserListResult {
  rows: AdminUserRow[];
  count: number;
  meta: { page: number; pageSize: number };
}
