const createResourceKeys = <const TName extends string>(name: TName) => {
  const all = [name] as const;
  return {
    all,
    lists: () => [...all, 'list'] as const,
    list: (params: unknown = {}) => [...all, 'list', params] as const,
    details: () => [...all, 'detail'] as const,
    detail: (id: string | number) => [...all, 'detail', String(id)] as const,
  };
};

export const userKeys = createResourceKeys('admin-users');
export const childProfileKeys = createResourceKeys('admin-child-profiles');
export const bookingKeys = createResourceKeys('admin-bookings');
export const publisherKeys = createResourceKeys('admin-publishers');
export const contentKeys = createResourceKeys('admin-content');
export const financialKeys = createResourceKeys('admin-financials');
export const settingsKeys = createResourceKeys('admin-settings');
export const auditLogKeys = createResourceKeys('admin-audit-logs');

/** Cross-application keys kept here so feature mutations do not repeat literals. */
export const accountKeys = {
  all: ['userAccountData'] as const,
  detail: (id: string | number) => ['userAccountData', String(id)] as const,
};

export const publicDataKeys = {
  all: ['publicData'] as const,
};
