import type { PersonalizedProduct } from '../../../lib/database.types';

export type OrderJourney = 'custom' | 'library';

export const getOrderJourney = (product: PersonalizedProduct | undefined): OrderJourney =>
  product?.product_type === 'library_book' ? 'library' : 'custom';

export const getOrderSteps = (journey: OrderJourney) => [
  { key: 'child', title: journey === 'library' ? 'الطفل والغلاف' : 'بيانات الطفل' },
  ...(journey === 'custom' ? [{ key: 'story', title: 'تفاصيل التخصيص' }] : []),
  ...(journey === 'custom' ? [{ key: 'addons', title: 'إضافات' }] : []),
  { key: 'delivery', title: 'الشحن' },
  { key: 'review', title: 'المراجعة' },
];
