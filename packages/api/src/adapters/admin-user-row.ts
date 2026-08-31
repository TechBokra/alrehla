import type { ChildProfile, UserProfile } from '@alrehla/types';
import type { AdminUserRow } from '../view-models/user';

export function toAdminUserRows(users: UserProfile[], children: ChildProfile[], parentsMap: Map<string, { name: string; email: string }>): AdminUserRow[] {
  const parentIdToChildren = new Map<string, ChildProfile[]>();
  children.forEach((child) => {
    const parentId = child.user_id ? String(child.user_id).trim() : '';
    if (!parentId) return;
    const current = parentIdToChildren.get(parentId) ?? [];
    current.push(child);
    parentIdToChildren.set(parentId, current);
  });

  return users.map((user) => {
    const userId = String(user.id).trim();
    const userChildren = parentIdToChildren.get(userId) ?? [];
    let parentName: string | undefined;
    let parentEmail: string | undefined;
    let relatedChildName: string | undefined;
    if (user.role === 'student') {
      const child = children.find((candidate) => candidate.student_user_id && String(candidate.student_user_id).trim() === userId);
      if (child) {
        relatedChildName = child.name;
        if (child.user_id) {
          const parent = parentsMap.get(String(child.user_id));
          parentName = parent?.name ?? 'غير معروف (حساب محذوف؟)';
          parentEmail = parent?.email;
        }
      }
    }
    return {
      ...user,
      activeStudentsCount: userChildren.filter((child) => Boolean(child.student_user_id)).length,
      totalChildrenCount: userChildren.length,
      isActuallyParent: userChildren.length > 0,
      children: userChildren,
      parentName,
      parentEmail,
      relatedChildName,
    };
  });
}
