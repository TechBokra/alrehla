export type SubscriptionStepKey = 'plan' | 'child' | 'addons' | 'delivery';

export interface SubscriptionFormValues {
  childName: string;
  childBirthDate: string;
  childGender: 'ذكر' | 'أنثى' | '';
  shippingOption: 'my_address' | 'gift';
  recipientName: string;
  recipientAddress: string;
  recipientPhone: string;
  recipientEmail: string;
  governorate: string;
  childInterests: string;
  childShirtSize: string;
  giftMessage: string;
  sendDigitalCard: boolean;
}

export const subscriptionSteps: ReadonlyArray<{
  key: SubscriptionStepKey;
  title: string;
}> = [
  { key: 'plan', title: 'اختر الباقة' },
  { key: 'child', title: 'لمن الصندوق؟' },
  { key: 'addons', title: 'إضافات' },
  { key: 'delivery', title: 'الشحن والتأكيد' },
];

export const defaultSubscriptionFormValues: SubscriptionFormValues = {
  childName: '',
  childBirthDate: '',
  childGender: '',
  shippingOption: 'my_address',
  recipientName: '',
  recipientAddress: '',
  recipientPhone: '',
  recipientEmail: '',
  governorate: '',
  childInterests: '',
  childShirtSize: '',
  giftMessage: '',
  sendDigitalCard: false,
};
