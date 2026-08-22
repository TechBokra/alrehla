'use client';

import { useForm } from '@tanstack/react-form';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useCart } from '../../../contexts/CartContext';
import { useToast } from '../../../contexts/ToastContext';
import { useOrderData, type OrderData } from '../../../hooks/queries/public/usePageDataQuery';
import { useShippingCosts } from '../../../hooks/queries/public/useProductDataQuery';
import { createOrderSchema, OrderFormValues } from '../../../lib/schemas';
import { EGYPTIAN_GOVERNORATES } from '../../../utils/governorates';
import * as userActions from '../../../actions/userActions';
import { getOrderJourney, getOrderSteps, type OrderJourney } from '../lib/orderJourneyConfig';

export interface UseOrderPageProps {
  initialOrderData?: OrderData;
  productKey?: string;
  expectedJourney?: OrderJourney;
}

export function useOrderPage({ initialOrderData, productKey: productKeyOverride, expectedJourney }: UseOrderPageProps = {}) {
  const { productKey: routeProductKey } = useParams<{ productKey: string }>();
  const productKey = productKeyOverride || routeProductKey;
  const router = useRouter();
  const { addItemToCart } = useCart();
  const { addToast } = useToast();
  const { isLoggedIn, currentUser, childProfiles, isProfileComplete, triggerProfileUpdate } =
    useAuth();
  const { data: shippingCosts } = useShippingCosts();
  const { data, isLoading } = useOrderData(initialOrderData);

  const [step, setStep] = useState(0);
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get current product
  const product = useMemo(
    () => data?.personalizedProducts.find((p) => p.key === productKey && (!expectedJourney || getOrderJourney(p) === expectedJourney)),
    [data, productKey, expectedJourney],
  );

  const storyGoals = useMemo(() => product?.story_goals || [], [product?.story_goals]);
  const orderSchema = useMemo(() => createOrderSchema(product), [product]);

  const submitRef = useRef<(data: OrderFormValues) => Promise<void>>();
  const invalidSubmitRef = useRef<(formApi: any) => void>();
  const form = useForm<OrderFormValues, any, any, any, any, any, any, any, any, any, any, any>({
    validators: {
      onChange: orderSchema,
      onSubmit: orderSchema,
    },
    onSubmit: async ({ value }) => submitRef.current?.(value),
    onSubmitInvalid: ({ formApi }) => invalidSubmitRef.current?.(formApi),
    defaultValues: {
      childName: '',
      childBirthDate: '',
      childGender: '' as any, // Initialize as empty to show placeholder
      deliveryType: 'printed',
      shippingOption: 'my_address',
    },
  });

  const deliveryType = form.getFieldValue('deliveryType');
  const shippingOption = form.getFieldValue('shippingOption');
  const governorate = form.getFieldValue('governorate');
  const sendDigitalCard = form.getFieldValue('sendDigitalCard');

  // Some add-ons are physical-only and therefore have no electronic price.
  // Never offer an add-on that the secure order RPC must reject for the
  // selected delivery format.
  const addonProducts = useMemo(
    () =>
      (data?.personalizedProducts || []).filter((product) => {
        if (!product.is_addon) return false;
        return deliveryType === 'electronic'
          ? product.price_electronic != null
          : product.price_printed != null;
      }),
    [data, deliveryType],
  );

  useEffect(() => {
    const availableAddonKeys = new Set(addonProducts.map((product) => product.key));
    setSelectedAddons((current) => {
      const next = current.filter((key) => availableAddonKeys.has(key));
      return next.length === current.length ? current : next;
    });
  }, [addonProducts]);

  // --- Journey-specific steps ---
  const journey: OrderJourney = getOrderJourney(product);
  const isLibraryBook = journey === 'library';

  const steps = useMemo(() => getOrderSteps(journey), [journey]);

  // Reset form when child is selected
  useEffect(() => {
    if (selectedChildId) {
      const child = childProfiles.find((c) => c.id === selectedChildId);
      if (child) {
        form.setFieldValue('childName', child.name);
        form.setFieldValue('childBirthDate', child.birth_date);
        form.setFieldValue('childGender', child.gender);
      }
    }
  }, [selectedChildId, childProfiles, form]);

  // Auto-fill shipping if user is logged in
  useEffect(() => {
    if (isLoggedIn && currentUser && shippingOption === 'my_address') {
      if (!form.getFieldValue('recipientName'))
        form.setFieldValue('recipientName', currentUser.name || '');
      if (!form.getFieldValue('recipientAddress'))
        form.setFieldValue('recipientAddress', currentUser.address || '');
      if (!form.getFieldValue('recipientPhone'))
        form.setFieldValue('recipientPhone', currentUser.phone || '');
      if (!form.getFieldValue('recipientEmail'))
        form.setFieldValue('recipientEmail', currentUser.email || '');

      const currentGov = form.getFieldValue('governorate');
      if (!currentGov) {
        const gov =
          currentUser.governorate ||
          (currentUser.city && EGYPTIAN_GOVERNORATES.includes(currentUser.city)
            ? currentUser.city
            : '');
        if (gov) form.setFieldValue('governorate', gov);
      }
    }
  }, [isLoggedIn, currentUser, shippingOption, form]);

  // Keep all derived pricing stable between unrelated renders. This also
  // ensures the preview receives referentially stable values when the user
  // edits a field outside the pricing inputs.
  const basePrice = useMemo(() => {
    if (!product) return 0;
    return (deliveryType === 'electronic' ? product.price_electronic : product.price_printed) || 0;
  }, [deliveryType, product?.price_electronic, product?.price_printed]);

  const addonsList = useMemo(
    () =>
      selectedAddons.map((key) => {
        const addon = addonProducts.find((candidate) => candidate.key === key);
        return {
          key,
          title: addon?.title || '',
          price:
            (deliveryType === 'electronic' ? addon?.price_electronic : addon?.price_printed) || 0,
        };
      }),
    [selectedAddons, addonProducts, deliveryType],
  );

  const addonsPrice = useMemo(
    () => addonsList.reduce((sum, addon) => sum + addon.price, 0),
    [addonsList],
  );

  const totalPrice = useMemo(() => basePrice + addonsPrice, [basePrice, addonsPrice]);

  const shippingPrice = useMemo(() => {
    if (deliveryType !== 'printed' || !shippingCosts || !governorate) return 0;
    const egyptCosts = shippingCosts['مصر'] || shippingCosts;
    return egyptCosts[governorate] || egyptCosts['باقي المحافظات'] || egyptCosts['default'] || 0;
  }, [deliveryType, governorate, shippingCosts]);

  const currentStepKey = steps[step]?.key || '';

  const goToDeliveryStep = () => {
    const deliveryStepIndex = steps.findIndex((currentStep) => currentStep.key === 'delivery');
    if (deliveryStepIndex < 0) return;
    setStep(deliveryStepIndex);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNext = async () => {
    if (!product) return;
    const currentFormData = form.state.values as OrderFormValues;
    let fieldsToValidate: any[] = [];

    if (currentStepKey === 'child') {
      fieldsToValidate = ['childName', 'childBirthDate', 'childGender'];
      // Fix: For Library Books, images are uploaded in the Child step
      if (isLibraryBook && product.image_slots) {
        const imageFields = product.image_slots.map((slot) => slot.id);
        fieldsToValidate = [...fieldsToValidate, ...imageFields];
      }
      if (isLibraryBook && product.text_fields) {
        fieldsToValidate = [
          ...fieldsToValidate,
          ...product.text_fields.filter((field) => field.required).map((field) => field.id),
        ];
      }
    }

    // Validation for story customization only if step exists
    if (currentStepKey === 'story' && journey === 'custom') {
      fieldsToValidate = ['storyValue', 'customGoal'];
      if (product.text_fields) {
        fieldsToValidate = [
          ...fieldsToValidate,
          ...product.text_fields.filter((f) => f.required).map((f) => f.id),
        ];
      }
      // Fix: For Hero Stories, images are uploaded in the Story step
      if (product.image_slots) {
        const imageFields = product.image_slots.map((slot) => slot.id);
        fieldsToValidate = [...fieldsToValidate, ...imageFields];
      }
    }

    if (currentStepKey === 'delivery' && currentFormData.deliveryType === 'printed') {
      fieldsToValidate = ['recipientName', 'recipientAddress', 'recipientPhone', 'governorate'];
      if (currentFormData.sendDigitalCard) fieldsToValidate.push('recipientEmail');
    }

    const validationErrors = await form.validate('change', {
      filterFieldNames: (fieldName: string) => fieldsToValidate.includes(fieldName),
    });
    const isValid = Object.keys(validationErrors).length === 0;
    if (isValid) {
      if (isLoggedIn && currentUser && currentStepKey === 'delivery' && currentFormData.deliveryType === 'printed') {
        const addressUpdates: Record<string, any> = {};
        if (currentFormData.recipientPhone && currentFormData.recipientPhone !== currentUser.phone) {
          addressUpdates.phone = currentFormData.recipientPhone;
        }
        if (currentFormData.recipientAddress && currentFormData.recipientAddress !== currentUser.address) {
          addressUpdates.address = currentFormData.recipientAddress;
        }
        if (currentFormData.governorate && currentFormData.governorate !== currentUser.governorate) {
          addressUpdates.governorate = currentFormData.governorate;
          addressUpdates.city = currentFormData.governorate;
        }
        if (!currentUser.country) {
          addressUpdates.country = 'مصر';
        }
        if (Object.keys(addressUpdates).length > 0) {
          userActions.updateUser(addressUpdates).catch((err) => console.warn('Background profile sync:', err));
        }
      }

      setStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Optional: visual feedback if validation fails silently (though fields usually turn red)
      if (
        (journey === 'custom' && currentStepKey === 'story') ||
        (journey === 'library' && currentStepKey === 'child')
      ) {
        // Check if image errors exist
        if (product.image_slots?.some((slot) => form.getFieldMeta(slot.id)?.errors?.length)) {
          addToast('يرجى رفع الصور المطلوبة للمتابعة.', 'error');
        }
      }
      addToast('يرجى إكمال البيانات المطلوبة في هذه الخطوة.', 'warning');
    }
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  // Redirect to Family Center
  const handleAddChild = () => {
    router.push('/account?tab=familyCenter');
  };

  const onError = (formApi: any) => {
    const fieldMeta = formApi.state.fieldMeta || {};
    const errors = Object.entries(fieldMeta).reduce(
      (result: Record<string, any>, [fieldName, meta]: [string, any]) => {
        const error = meta?.errors?.[0];
        if (error) result[fieldName] = typeof error === 'string' ? error : error.message;
        return result;
      },
      {},
    );
    console.error('Form Validation Errors:', errors);
    const errorMessages = Object.values(errors).join('، ');
    addToast(`عذراً، يوجد بيانات ناقصة: ${errorMessages.substring(0, 50)}...`, 'error');

    // محاولة العودة للخطوة التي تحتوي على الخطأ (بسيط)
    if (errors.childName || errors.childBirthDate) {
      const childStep = steps.findIndex((s) => s.key === 'child');
      if (step !== childStep) setStep(childStep);
    } else if (errors.recipientAddress || errors.governorate) {
      const deliveryStep = steps.findIndex((s) => s.key === 'delivery');
      if (step !== deliveryStep) setStep(deliveryStep);
    }
  };

  const onSubmit = async (data: OrderFormValues) => {
    if (!product) return;

    // 1. Strict Login Check
    if (!isLoggedIn) {
      addToast('يجب تسجيل الدخول لإتمام الطلب وإضافته للسلة.', 'info');
      router.push('/account');
      return;
    }

    // Auto-update user profile details in background
    if (isLoggedIn && currentUser && data.deliveryType === 'printed') {
      const addressUpdates: Record<string, any> = {};
      if (data.recipientPhone && data.recipientPhone !== currentUser.phone) addressUpdates.phone = data.recipientPhone;
      if (data.recipientAddress && data.recipientAddress !== currentUser.address) addressUpdates.address = data.recipientAddress;
      if (data.governorate && data.governorate !== currentUser.governorate) {
        addressUpdates.governorate = data.governorate;
        addressUpdates.city = data.governorate;
      }
      if (!currentUser.country) addressUpdates.country = 'مصر';
      if (Object.keys(addressUpdates).length > 0) {
        userActions.updateUser(addressUpdates).catch((err) => console.warn('Background profile sync:', err));
      }
    }

    // 3. Strict Shipping & Address Check for Printed Items
    if (data.deliveryType === 'printed') {
      if (!data.governorate || data.governorate.trim() === '') {
        addToast('عذراً، يجب تحديد المحافظة لحساب تكلفة الشحن.', 'error');
        const deliveryStepIndex = steps.findIndex((s) => s.key === 'delivery');
        setStep(deliveryStepIndex);
        return;
      }
      if (!data.recipientAddress || data.recipientAddress.trim() === '') {
        addToast('العنوان التفصيلي مطلوب للتوصيل.', 'error');
        const deliveryStepIndex = steps.findIndex((s) => s.key === 'delivery');
        setStep(deliveryStepIndex);
        return;
      }

      let calculatedShipping = 0;
      if (shippingCosts && data.governorate) {
        const egyptCosts = shippingCosts['مصر'] || shippingCosts;
        calculatedShipping =
          egyptCosts[data.governorate] || egyptCosts['باقي المحافظات'] || egyptCosts['default'] || 0;
      }

      if (calculatedShipping <= 0) {
        console.warn('Shipping cost is 0 or missing, defaulting to safe fallback or blocking.');
        if (shippingCosts && Object.keys(shippingCosts).length > 0) {
          addToast('حدث خطأ في حساب الشحن للمحافظة المختارة.', 'error');
          return;
        }
      }
    }

    setIsSubmitting(true);

    try {
      // Keep files local through the wizard and cart transition. The checkout
      // server action owns the authenticated upload and order mutation.
      const files: Record<string, File> = {};
      if (product.image_slots) {
        product.image_slots.forEach((slot) => {
          if ((data as any)[slot.id] instanceof File) {
            files[slot.id] = (data as any)[slot.id];
          }
        });
      }

      let finalShippingPrice = 0;
      if (data.deliveryType === 'printed' && shippingCosts) {
        const egyptCosts = shippingCosts['مصر'] || shippingCosts;
        finalShippingPrice =
          egyptCosts[data.governorate || ''] ||
          egyptCosts['باقي المحافظات'] ||
          egyptCosts['default'] ||
          0;
      }

      const currentBasePrice =
        (data.deliveryType === 'electronic' ? product.price_electronic : product.price_printed) ||
        0;
      const unavailableAddon = selectedAddons.find((addonKey) => {
        const addon = addonProducts.find((candidate) => candidate.key === addonKey);
        const price =
          data.deliveryType === 'electronic' ? addon?.price_electronic : addon?.price_printed;
        return !addon || price == null;
      });
      if (unavailableAddon) {
        addToast('إحدى الإضافات غير متاحة لنوع النسخة المختار. أزلها ثم حاول مرة أخرى.', 'error');
        return;
      }

      const currentAddonsPrice = selectedAddons.reduce((sum, addonKey) => {
        const addon = addonProducts.find((candidate) => candidate.key === addonKey);
        if (!addon) return sum;
        const price =
          data.deliveryType === 'electronic' ? addon.price_electronic : addon.price_printed;
        return sum + (price || 0);
      }, 0);
      const finalTotal = currentBasePrice + currentAddonsPrice;

      addItemToCart({
        type: 'order',
        payload: {
          productKey: product.key,
          formData: data,
          files,
          selectedAddons,
          totalPrice: finalTotal,
          shippingPrice: finalShippingPrice,
          summary: `${product.title} لـ ${data.childName}`,
          // IMPORTANT: Explicitly passing childId to avoid duplication in checkout
          childId: selectedChildId,
          details: {
            ...data,
            productTitle: product.title,
            isPrinted: data.deliveryType === 'printed',
            productType: product.product_type,
            journey,
            format: data.deliveryType,
            childId: selectedChildId,
          },
        },
      });

      addToast('تمت إضافة الطلب للسلة بنجاح!', 'success');
      router.push('/cart');
    } catch (error) {
      console.error('Cart Error', error);
      addToast('حدث خطأ أثناء الإضافة للسلة. يرجى المحاولة مرة أخرى.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  submitRef.current = onSubmit;
  invalidSubmitRef.current = onError;

  return {
    isLoading,
    product,
    form,
    steps,
    step,
    currentStepKey,
    isLibraryBook,
    journey,
    selectedChildId,
    setSelectedChildId,
    selectedAddons,
    setSelectedAddons,
    addonProducts,
    basePrice,
    addonsList,
    totalPrice,
    shippingPrice,
    shippingCosts,
    isSubmitting,
    isLoggedIn,
    childProfiles,
    currentUser,
    storyGoals,
    goToDeliveryStep,
    handleNext,
    handleBack,
    handleAddChild,
  };
}
