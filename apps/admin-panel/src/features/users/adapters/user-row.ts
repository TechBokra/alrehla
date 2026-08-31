import type { AdminUserRow } from '@alrehla/api/view-models/user';

/** Feature adapter: keeps the table contract independent from API DTO naming. */
export function toUserRow(row: AdminUserRow): AdminUserRow {
  return {
    ...row,
    children: row.children ?? [],
    activeStudentsCount: row.activeStudentsCount ?? 0,
    totalChildrenCount: row.totalChildrenCount ?? 0,
    isActuallyParent: row.isActuallyParent ?? false,
  };
}
