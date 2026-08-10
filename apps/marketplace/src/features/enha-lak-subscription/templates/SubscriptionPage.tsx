'use client';

// ... existing imports
import { useRouter } from 'next/navigation';
import { Button } from '@alrehla/ui/button';
import { Card, CardContent } from '@alrehla/ui/card';
import React, { useEffect, useMemo, useState } from 'react';
import AddonsSection from '../../../components/order/AddonsSection';
import ChildDetailsSection from '../../../components/order/ChildDetailsSection';
import OrderStepper from '../../../components/order/OrderStepper';
import ShippingAddressForm from '../../../components/shared/ShippingAddressForm';
import SubscriptionSummary from '../../../components/subscription/SubscriptionSummary';
import { useAuth } from '../../../contexts/AuthContext';
import { useCart } from '../../../contexts/CartContext';
import { useToast } from '../../../contexts/ToastContext';
import { EGYPTIAN_GOVERNORATES } from '../../../utils/governorates';
import * as userActions from '../../../actions/userActions';
import type { EnhaLakSubscriptionData } from '../../../services/enhaLakPublicService';

const steps = [
  { key: 'plan', title: 'اختر الباقة' },
  { key: 'child', title: 'لمن الصندوق؟' },
  { key: 'addons', title: 'إضافات' },
  { key: 'delivery', title: 'الشحن والتأكيد' },
];

interface SubscriptionPageProps {
  initialData: EnhaLakSubscriptionData;
}

const SubscriptionPage: React.FC<SubscriptionPageProps> = ({ initialData }) => {
  const router = useRouter();
  const { addItemToCart } = useCart();
  const { addToast } = useToast();
  const { currentUser, childProfiles, isLoggedIn, isProfileComplete, triggerProfileUpdate } =
    useAuth();
  const shippingCosts = initialData.shippingCosts;

  const getOneTimeShippingCost = (governorate?: string): number => {
    if (!governorate) return 0;
    const egyptCosts = (shippingCosts?.['مصر'] || shippingCosts || {}) as Record<string, any>;
    return Number(
      egyptCosts[governorate] ||
      egyptCosts['باقي المحافظات'] ||
      egyptCosts['default'] ||
      50
    );
  };

  const [step, setStep] = useState(0);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [formData, setFormData] = useState<any>({
    childName: '',
    childBirthDate: '',
    childGender: '',
    shippingOption: 'my_address',
    recipientName: '',
    recipientAddress: '',
    recipientPhone: '',
    governorate: '',
    // Custom fields for box customization
    childInterests: '',
    childShirtSize: '',
  });
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [errors, setErrors] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const plans = initialData.subscriptionPlans;
  const addonProducts =
    initialData.personalizedProducts.filter((p) => p.is_addon && p.price_printed != null);
  const boxContent = initialData.siteContent?.enhaLakPage.subscription;

  const selectedPlan = useMemo(
    () => plans.find((p) => p.id === selectedPlanId) || null,
    [plans, selectedPlanId],
  );

  // Auto-fill shipping
  useEffect(() => {
    if (isLoggedIn && currentUser && formData.shippingOption === 'my_address') {
      setFormData((prev) => ({
        ...prev,
        recipientName: currentUser.name || '',
        recipientAddress: currentUser.address || '',
        recipientPhone: currentUser.phone || '',
        recipientEmail: currentUser.email || '',
        governorate:
          currentUser.governorate ||
          (currentUser.city && EGYPTIAN_GOVERNORATES.includes(currentUser.city)
            ? currentUser.city
            : ''),
      }));
    }
  }, [isLoggedIn, currentUser, formData.shippingOption]);

  const handleChildSelect = (child: any) => {
    if (child) {
      setSelectedChildId(child.id);
      setFormData((prev) => ({
        ...prev,
        childName: child.name,
        childBirthDate: child.birth_date,
        childGender: child.gender,
        childInterests: child.interests?.join(', ') || '',
      }));
    } else {
      setSelectedChildId(null);
      setFormData((prev) => ({
        ...prev,
        childName: '',
        childBirthDate: '',
        childGender: '',
        childInterests: '',
      }));
    }
  };

  const handleAddChild = () => {
    router.push('/account?tab=familyCenter');
  };

  const validateStep = (currentStepKey: string) => {
    const newErrors: any = {};

    switch (currentStepKey) {
      case 'plan':
        if (!selectedPlanId) newErrors.plan = 'يرجى اختيار باقة.';
        break;
      case 'child':
        if (!formData.childName) newErrors.childName = 'اسم الطفل مطلوب.';
        if (!formData.childBirthDate) newErrors.childBirthDate = 'تاريخ الميلاد مطلوب.';
        if (!formData.childGender) newErrors.childGender = 'الجنس مطلوب.';
        break;
      case 'delivery':
        if (!formData.recipientName) newErrors.recipientName = 'اسم المستلم مطلوب.';
        if (!formData.recipientAddress) newErrors.recipientAddress = 'عنوان المستلم مطلوب.';

        if (!formData.recipientPhone) {
          newErrors.recipientPhone = 'هاتف المستلم مطلوب.';
        } else if (!/^01[0125][0-9]{8}$/.test(formData.recipientPhone)) {
          newErrors.recipientPhone = 'يرجى إدخال رقم هاتف مصري صحيح (مثال: 01012345678)';
        }

        // STRICT CHECK: Governorate is mandatory for shipping calculation
        if (!formData.governorate || formData.governorate.trim() === '') {
          newErrors.governorate = 'المحافظة مطلوبة بشكل إلزامي لحساب الشحن.';
        }
        break;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(steps[step].key)) {
      setStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      addToast('يرجى إكمال البيانات المطلوبة.', 'error');
    }
  };

  const handleBack = () => setStep((prev) => prev - 1);

  const handleSubmit = async () => {
    // Auto-update user profile in background
    if (currentUser && formData.governorate) {
      const addressUpdates: Record<string, any> = {};
      if (formData.recipientPhone && formData.recipientPhone !== currentUser.phone) addressUpdates.phone = formData.recipientPhone;
      if (formData.recipientAddress && formData.recipientAddress !== currentUser.address) addressUpdates.address = formData.recipientAddress;
      if (formData.governorate && formData.governorate !== currentUser.governorate) {
        addressUpdates.governorate = formData.governorate;
        addressUpdates.city = formData.governorate;
      }
      if (!currentUser.country) addressUpdates.country = 'مصر';
      if (Object.keys(addressUpdates).length > 0) {
        userActions.updateUser(addressUpdates).catch((err) => console.warn('Background profile sync:', err));
      }
    }

    if (!validateStep('delivery')) return;

    // Double check shipping before submitting
    let shippingPrice = 0;
    if (formData.governorate) {
      const oneTimeShipping = getOneTimeShippingCost(formData.governorate);
      shippingPrice = oneTimeShipping * (selectedPlan?.duration_months || 1);
    }

    if (shippingPrice <= 0) {
      addToast('عذراً، لم يتم حساب الشحن بشكل صحيح. يرجى التأكد من اختيار المحافظة.', 'error');
      setErrors({ ...errors, governorate: 'المحافظة مطلوبة' });
      return;
    }

    setIsSubmitting(true);

    // Calculate Totals
    const planPrice = selectedPlan?.price || 0;
    const addonsPrice = selectedAddons.reduce((sum, key) => {
      const p = addonProducts.find((ap) => ap.key === key);
      return sum + (p?.price_printed || 0);
    }, 0);

    const total = planPrice + addonsPrice; // Base Total

    addItemToCart({
      type: 'subscription',
      payload: {
        planId: selectedPlanId,
        planName: selectedPlan?.name,
        durationMonths: selectedPlan?.duration_months,
        childId: selectedChildId,
        formData,
        selectedAddons,
        totalPrice: total,
        shippingPrice, // Passed separately
        summary: `اشتراك صندوق الرحلة (${selectedPlan?.name}) لـ ${formData.childName}`,
        details: {
          ...formData,
          addons: selectedAddons,
          planName: selectedPlan?.name,
          durationMonths: selectedPlan?.duration_months,
        },
      },
    });

    addToast('تمت إضافة الاشتراك للسلة!', 'success');
    router.push('/cart');
    setIsSubmitting(false);
  };

  const currentStepKey = steps[step].key;

  return (
    <div className="bg-gray-50 py-16 animate-fadeIn min-h-screen">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-foreground">
            {boxContent?.heroTitle || 'صندوق الرحلة الشهري'}
          </h1>
          <p className="mt-2 text-muted-foreground">{boxContent?.heroSubtitle}</p>
        </div>

        <OrderStepper steps={steps} currentStep={currentStepKey} />

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardContent className="pt-6">
                {currentStepKey === 'plan' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {plans.map((plan) => (
                      <div
                        key={plan.id}
                        onClick={() => setSelectedPlanId(plan.id)}
                        className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${selectedPlanId === plan.id ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-gray-200 hover:border-primary/50'}`}
                      >
                        {plan.is_best_value && (
                          <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded mb-2 inline-block">
                            الأفضل قيمة
                          </span>
                        )}
                        <h3 className="font-bold text-lg">{plan.name}</h3>
                        <div className="my-4">
                          <span className="text-3xl font-extrabold">{plan.price} ج.م</span>
                          <p className="text-xs text-muted-foreground">
                            ({plan.price_per_month} ج.م / شهر)
                          </p>
                        </div>
                        <p className="text-sm text-gray-600">
                          {plan.duration_months} أشهر من المرح والتعلم.
                        </p>
                        {plan.savings_text && (
                          <p className="text-sm font-bold text-green-600 mt-2">
                            {plan.savings_text}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {currentStepKey === 'child' && (
                  <div className="space-y-6">
                    <ChildDetailsSection
                      childProfiles={childProfiles}
                      onSelectChild={handleChildSelect}
                      selectedChildId={selectedChildId}
                      currentUser={currentUser}
                      onAddChild={handleAddChild}
                      formData={formData}
                      handleChange={(e) =>
                        setFormData({ ...formData, [e.target.name]: e.target.value })
                      }
                      errors={errors}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          اهتمامات الطفل (يساعدنا في اختيار محتوى الصندوق)
                        </label>
                        <input
                          type="text"
                          name="childInterests"
                          value={formData.childInterests}
                          onChange={(e) =>
                            setFormData({ ...formData, childInterests: e.target.value })
                          }
                          className="w-full p-2 border rounded-md"
                          placeholder="فضاء، حيوانات، رسم..."
                        />
                      </div>
                    </div>
                  </div>
                )}

                {currentStepKey === 'addons' && (
                  <AddonsSection
                    addonProducts={addonProducts}
                    selectedAddons={selectedAddons}
                    onToggle={(key) =>
                      setSelectedAddons((prev) =>
                        prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
                      )
                    }
                  />
                )}

                {currentStepKey === 'delivery' && (
                  <ShippingAddressForm
                    formData={formData}
                    handleChange={(e) => {
                      const { name, value, type, checked } = e.target;
                      setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
                    }}
                    setValue={(name, value) => setFormData({ ...formData, [name]: value })}
                    errors={errors}
                  />
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button onClick={handleBack} disabled={step === 0} variant="outline">
                السابق
              </Button>
              {step < steps.length - 1 && <Button onClick={handleNext}>التالي</Button>}
            </div>
          </div>

          <div className="lg:col-span-1 sticky top-24">
            <SubscriptionSummary
              selectedPlan={selectedPlan}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
              step={currentStepKey}
              features={boxContent?.features}
              shippingCost={
                formData.governorate
                  ? getOneTimeShippingCost(formData.governorate) *
                    (selectedPlan?.duration_months || 1)
                  : 0
              }
              addonsCost={selectedAddons.reduce(
                (sum, key) => sum + (addonProducts.find((p) => p.key === key)?.price_printed || 0),
                0,
              )}
              selectedAddons={selectedAddons}
              addonProducts={addonProducts}
              governorate={formData.governorate}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
