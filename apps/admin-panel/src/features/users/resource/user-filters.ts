import type { DataViewFilterDefinition } from '@alrehla/admin-core/data-view';

export const USER_TABS = [
  { value: 'parent', label: 'أولياء الأمور' },
  { value: 'customers', label: 'عملاء (أخرى)' },
  { value: 'student', label: 'حسابات الطلاب' },
  { value: 'publisher', label: 'شركاء (دور النشر)' },
  { value: 'staff', label: 'الموظفون والمدربون' },
] as const;

export const USER_DATA_VIEW_FILTERS: readonly DataViewFilterDefinition[] = [
  {
    id: 'roleFilter',
    parameter: 'tab',
    label: 'الفئة',
    type: 'single-select',
    options: USER_TABS,
  },
];
