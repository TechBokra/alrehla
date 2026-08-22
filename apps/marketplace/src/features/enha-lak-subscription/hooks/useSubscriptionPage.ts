'use client';

import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { useCart } from '../../../contexts/CartContext';
import { useToast } from '../../../contexts/ToastContext';
import { EGYPTIAN_GOVERNORATES } from '../../../utils/governorates';
import * as userActions from '../../../actions/userActions';
import type { EnhaLakSubscriptionData } from '../../../services/enhaLakPublicService';
import type { OrderFormApi } from '../../../components/order/form-types';
import type { ChildProfile, UserProfile } from '@alrehla/types';
import {
  defaultSubscriptionFormValues,
  subscriptionSteps,
  type SubscriptionFormValues,
  type SubscriptionStepKey,
} from '../types';

const egyptianPhonePattern = /^01[0125][0-9]{8}$/;

const subscriptionFormSchema = z
  .object({
    childName: z.string().trim().min(1, 'اسم الطفل مطلوب.'),
    childBirthDate: z.string().min(1, 'تاريخ الميلاد مطلوب.'),
    childGender: z.enum(['ذكر', 'أنثى'], {
      errorMap: () => ({ message: 'الجنس مطلوب.' }),
    }),
    shippingOption: z.enum(['my_address', 'gift']),
    recipientName: z.string().optional(),
    recipientAddress: z.string().optional(),
    recipientPhone: z.string().optional(),
    recipientEmail: z.string().email('صيغة البريد الإلكتروني غير صحيحة.').or(z.literal('')),
    governorate: z.string().optional(),
    childInterests: z.string(),
    childShirtSize: z.string(),
    giftMessage: z.string(),
    sendDigitalCard: z.boolean(),
  })
  .superRefine((values, context) => {
    if (!values.governorate?.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'المحافظة مطلوبة لحساب الشحن.',
        path: ['governorate'],
      });
    }

    if (!values.recipientName?.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'اسم المستلم مطلوب.',
        path: ['recipientName'],
      });
    }

    if (!values.recipientAddress?.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'عنوان المستلم مطلوب.',
        path: ['recipientAddress'],
      });
    }

    if (!values.recipientPhone || !egyptianPhonePattern.test(values.recipientPhone)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'يرجى إدخال رقم هاتف مصري صحيح (مثال: 01012345678).',
        path: ['recipientPhone'],
      });
    }

    if (values.sendDigitalCard && !values.recipientEmail?.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'البريد الإلكتروني مطلوب لإرسال البطاقة الرقمية.',
        path: ['recipientEmail'],
      });
    }
  });

type SubscriptionSubmitHandler = (values: SubscriptionFormValues) => Promise<void>;

export interface UseSubscriptionPageResult {
  form: OrderFormApi;
  plans: EnhaLakSubscriptionData['subscriptionPlans'];
  addonProducts: EnhaLakSubscriptionData['personalizedProducts'];
  boxContent:
    | NonNullable<EnhaLakSubscriptionData['siteContent']>['enhaLakPage']['subscription']
    | undefined;
  childProfiles: ChildProfile[];
  currentUser: UserProfile | null;
  isLoggedIn: boolean;
  step: number;
  currentStepKey: SubscriptionStepKey;
  selectedPlan: EnhaLakSubscriptionData['subscriptionPlans'][number] | null;
  selectedPlanId: number | null;
  selectedChildId: number | null;
  selectedAddons: string[];
  isSubmitting: boolean;
  planError: string | undefined;
  getShippingPrice: (governorate?: string, durationMonths?: number) => number;
  getAddonsCost: (addonKeys?: string[]) => number;
  handleChildSelect: (child: ChildProfile | null) => void;
  handleAddChild: () => void;
  toggleAddon: (key: string) => void;
  handleNext: () => Promise<void>;
  handleBack: () => void;
  handleSubmit: () => Promise<void>;
  selectPlan: (planId: number) => void;
}

export function useSubscriptionPage({
  initialData,
}: {
  initialData: EnhaLakSubscriptionData;
}): UseSubscriptionPageResult {
  const router = useRouter();
  const { addItemToCart } = useCart();
  const { addToast } = useToast();
  const { currentUser, childProfiles, isLoggedIn } = useAuth();
  const [step, setStep] = useState(0);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [planError, setPlanError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitRef = useRef<SubscriptionSubmitHandler>();

  const plans = initialData.subscriptionPlans;
  const addonProducts = useMemo(
    () => initialData.personalizedProducts.filter((product) => product.is_addon && product.price_printed != null),
    [initialData.personalizedProducts],
  );
  const boxContent = initialData.siteContent?.enhaLakPage.subscription;

  const form = useForm<SubscriptionFormValues, any, any, any, any, any, any, any, any, any, any, any>({
    defaultValues: defaultSubscriptionFormValues,
    validators: {
      onChange: subscriptionFormSchema,
      onSubmit: subscriptionFormSchema,
    },
    onSubmit: async ({ value }) => submitRef.current?.(value),
  });

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === selectedPlanId) || null,
    [plans, selectedPlanId],
  );

  const getShippingPrice = useCallback(
    (governorate?: string, durationMonths = selectedPlan?.duration_months || 1) => {
      if (!governorate) return 0;
      const shippingCosts = initialData.shippingCosts;
      const egyptCosts = (shippingCosts?.['مصر'] || shippingCosts || {}) as Record<string, unknown>;
      const oneTimeCost = Number(
        egyptCosts[governorate] || egyptCosts['باقي المحافظات'] || egyptCosts.default || 50,
      );
      return oneTimeCost * durationMonths;
    },
    [initialData.shippingCosts, selectedPlan?.duration_months],
  );

  const getAddonsCost = useCallback(
    (addonKeys = selectedAddons) =>
      addonKeys.reduce(
        (sum, key) => sum + (addonProducts.find((product) => product.key === key)?.price_printed || 0),
        0,
      ),
    [addonProducts, selectedAddons],
  );

  useEffect(() => {
    if (!isLoggedIn || !currentUser || form.getFieldValue('shippingOption') !== 'my_address') return;

    form.setFieldValue('recipientName', currentUser.name || '');
    form.setFieldValue('recipientAddress', currentUser.address || '');
    form.setFieldValue('recipientPhone', currentUser.phone || '');
    form.setFieldValue('recipientEmail', currentUser.email || '');
    form.setFieldValue(
      'governorate',
      currentUser.governorate ||
        (currentUser.city && EGYPTIAN_GOVERNORATES.includes(currentUser.city) ? currentUser.city : ''),
    );
  }, [currentUser, form, isLoggedIn]);

  const selectPlan = useCallback((planId: number) => {
    setSelectedPlanId(planId);
    setPlanError(undefined);
  }, []);

  const handleChildSelect = useCallback(
    (child: ChildProfile | null) => {
      setSelectedChildId(child?.id ?? null);
      form.setFieldValue('childName', child?.name || '');
      form.setFieldValue('childBirthDate', child?.birth_date || '');
      form.setFieldValue('childGender', (child?.gender as SubscriptionFormValues['childGender']) || '');
      form.setFieldValue('childInterests', child?.interests?.join(', ') || '');
    },
    [form],
  );

  const handleAddChild = useCallback(() => {
    router.push('/account?tab=familyCenter');
  }, [router]);

  const toggleAddon = useCallback((key: string) => {
    setSelectedAddons((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
    );
  }, []);

  const validateStep = useCallback(
    async (stepKey: SubscriptionStepKey) => {
      if (stepKey === 'plan') {
        const valid = selectedPlanId !== null;
        setPlanError(valid ? undefined : 'يرجى اختيار باقة.');
        return valid;
      }

      if (stepKey === 'addons') return true;

      const fields =
        stepKey === 'child'
          ? ['childName', 'childBirthDate', 'childGender']
          : ['recipientName', 'recipientAddress', 'recipientPhone', 'governorate', 'recipientEmail'];
      const validationErrors = await form.validate('change', {
        filterFieldNames: (fieldName: string) => fields.includes(fieldName),
      });
      return Object.keys(validationErrors).length === 0;
    },
    [form, selectedPlanId],
  );

  const handleNext = useCallback(async () => {
    const currentStep = subscriptionSteps[step];
    if (!currentStep) return;

    const valid = await validateStep(currentStep.key);
    if (!valid) {
      addToast('يرجى إكمال البيانات المطلوبة.', 'error');
      return;
    }

    setStep((current) => Math.min(current + 1, subscriptionSteps.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [addToast, step, validateStep]);

  const handleBack = useCallback(() => {
    setStep((current) => Math.max(current - 1, 0));
  }, []);

  const submitSubscription = useCallback(
    async (values: SubscriptionFormValues) => {
      if (!selectedPlan) return;

      const shippingPrice = getShippingPrice(values.governorate);
      if (shippingPrice <= 0) {
        addToast('عذراً، لم يتم حساب الشحن بشكل صحيح. يرجى التأكد من اختيار المحافظة.', 'error');
        return;
      }

      if (currentUser) {
        const addressUpdates: Record<string, string> = {};
        if (values.recipientPhone && values.recipientPhone !== currentUser.phone) addressUpdates.phone = values.recipientPhone;
        if (values.recipientAddress && values.recipientAddress !== currentUser.address) addressUpdates.address = values.recipientAddress;
        if (values.governorate && values.governorate !== currentUser.governorate) {
          addressUpdates.governorate = values.governorate;
          addressUpdates.city = values.governorate;
        }
        if (!currentUser.country) addressUpdates.country = 'مصر';
        if (Object.keys(addressUpdates).length > 0) {
          userActions.updateUser(addressUpdates).catch((error) => console.warn('Background profile sync:', error));
        }
      }

      const addonsPrice = getAddonsCost();
      addItemToCart({
        type: 'subscription',
        payload: {
          planId: selectedPlan.id,
          planName: selectedPlan.name,
          durationMonths: selectedPlan.duration_months,
          childId: selectedChildId,
          formData: values,
          selectedAddons,
          totalPrice: selectedPlan.price + addonsPrice,
          shippingPrice,
          summary: `اشتراك صندوق الرحلة (${selectedPlan.name}) لـ ${values.childName}`,
          details: {
            ...values,
            addons: selectedAddons,
            planName: selectedPlan.name,
            durationMonths: selectedPlan.duration_months,
          },
        },
      });

      addToast('تمت إضافة الاشتراك للسلة!', 'success');
      router.push('/cart');
    },
    [addItemToCart, addToast, currentUser, getAddonsCost, getShippingPrice, router, selectedAddons, selectedChildId, selectedPlan],
  );

  submitRef.current = submitSubscription;

  const handleSubmit = useCallback(async () => {
    if (selectedPlanId === null) {
      setStep(0);
      setPlanError('يرجى اختيار باقة.');
      addToast('يرجى اختيار باقة قبل المتابعة.', 'error');
      return;
    }

    const deliveryValid = await validateStep('delivery');
    if (!deliveryValid) {
      addToast('يرجى إكمال بيانات الشحن.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await form.handleSubmit();
    } finally {
      setIsSubmitting(false);
    }
  }, [addToast, form, selectedPlanId, validateStep]);

  return {
    form: form as OrderFormApi,
    plans,
    addonProducts,
    boxContent,
    childProfiles,
    currentUser,
    isLoggedIn,
    step,
    currentStepKey: subscriptionSteps[step]?.key || 'plan',
    selectedPlan,
    selectedPlanId,
    selectedChildId,
    selectedAddons,
    isSubmitting,
    planError,
    getShippingPrice,
    getAddonsCost,
    handleChildSelect,
    handleAddChild,
    toggleAddon,
    handleNext,
    handleBack,
    handleSubmit,
    selectPlan,
  };
}
