'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useOrderPage, type UseOrderPageProps } from '../hooks/useOrderPage';
import PageLoader from '@alrehla/ui/page-loader';
import { Button } from '@alrehla/ui/button';
import OrderStepper from '../../../components/order/OrderStepper';
import ChildDetailsSection from '../../../components/order/ChildDetailsSection';
import StoryCustomizationSection from '../../../components/order/StoryCustomizationSection';
import ImageUploadSection from '../../../components/order/ImageUploadSection';
import LibraryCoverPersonalizationSection from '../../../components/order/LibraryCoverPersonalizationSection';
import AddonsSection from '../../../components/order/AddonsSection';
import DeliverySection from '../../../components/order/DeliverySection';
import InteractivePreview from '../../../components/order/InteractivePreview';
import { Card, CardContent } from '@alrehla/ui/card';
import { ArrowLeft, ArrowRight, Library, LogIn } from 'lucide-react';
import type { PersonalizedProduct } from '../../../lib/database.types';
import type { OrderFormApi } from '../../../components/order/form-types';
import type { OrderFormValues } from '../../../lib/schemas';
import type { OrderJourney } from '../lib/orderJourneyConfig';

interface OrderPreviewProps {
  form: OrderFormApi;
  product: PersonalizedProduct;
  basePrice: number;
  addons: { key: string; title: string; price: number }[];
  totalPrice: number;
  shippingPrice: number;
  storyGoals: { key: string; title: string }[];
  journey: OrderJourney;
}

interface OrderPreviewValuesProps extends Omit<OrderPreviewProps, 'form'> {
  values: OrderFormValues;
}

const OrderPreviewValues: React.FC<OrderPreviewValuesProps> = ({
  values,
  product,
  basePrice,
  addons,
  totalPrice,
  shippingPrice,
  storyGoals,
  journey,
}) => {
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const previewFormData = useMemo(() => {
    const textValues = (product.text_fields || []).reduce<Record<string, string>>(
      (result, field) => {
        result[field.id] = String(values[field.id] || '');
        return result;
      },
      {},
    );
    return {
      ...textValues,
      childName: String(values.childName || ''),
      childTraits: String(values.childTraits || ''),
      storyValue: String(values.storyValue || ''),
      customGoal: String(values.customGoal || ''),
    };
  }, [product.text_fields, values]);

  const imagePreviewFile = useMemo(() => {
    for (const slot of product.image_slots || []) {
      const file = values[slot.id];
      if (typeof File !== 'undefined' && file instanceof File) return file;
    }
    return null;
  }, [values, product.image_slots]);

  useEffect(() => {
    if (!imagePreviewFile) {
      setImagePreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(imagePreviewFile);
    setImagePreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [imagePreviewFile]);

  return (
    <InteractivePreview
      formData={previewFormData}
      product={product}
      basePrice={basePrice}
      addons={addons}
      totalPrice={totalPrice}
      shippingPrice={shippingPrice}
      imagePreviewUrl={imagePreviewUrl}
      storyGoals={storyGoals}
      journey={journey}
    />
  );
};

const OrderPreview = React.memo<OrderPreviewProps>(
  ({ form, product, basePrice, addons, totalPrice, shippingPrice, storyGoals, journey }) => (
    <form.Subscribe selector={(state: any) => state.values}>
      {(values: OrderFormValues) => (
        <OrderPreviewValues
          values={values}
          product={product}
          basePrice={basePrice}
          addons={addons}
          totalPrice={totalPrice}
          shippingPrice={shippingPrice}
          storyGoals={storyGoals}
          journey={journey}
        />
      )}
    </form.Subscribe>
  ),
);
OrderPreview.displayName = 'OrderPreview';

const OrderPage: React.FC<UseOrderPageProps> = ({ initialOrderData, productKey, expectedJourney }) => {
  const {
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
  } = useOrderPage({ initialOrderData, productKey, expectedJourney });

  if (isLoading) return <PageLoader text="جاري تحميل المنتج..." />;
  if (!product) return <div className="text-center py-20">المنتج غير موجود</div>;

  return (
    <form.Subscribe
      selector={(state: any) => ({
        values: state.values,
        deliveryType: state.values.deliveryType,
        governorate: state.values.governorate,
      })}
    >
      {(snapshot: any) => {
        const deliveryType = snapshot.deliveryType as 'printed' | 'electronic';
        const governorate = snapshot.governorate as string | undefined;
        const basePrice =
          (deliveryType === 'electronic' ? product.price_electronic : product.price_printed) || 0;
        const availableAddonProducts = addonProducts.filter((addon) =>
          deliveryType === 'electronic'
            ? addon.price_electronic != null
            : addon.price_printed != null,
        );
        const addonsList = selectedAddons
          .filter((key) => availableAddonProducts.some((addon) => addon.key === key))
          .map((key) => {
            const addon = availableAddonProducts.find((candidate) => candidate.key === key);
            return {
              key,
              title: addon?.title || '',
              price:
                (deliveryType === 'electronic' ? addon?.price_electronic : addon?.price_printed) ||
                0,
            };
          });
        const totalPrice = basePrice + addonsList.reduce((sum, addon) => sum + addon.price, 0);
        let shippingPrice = 0;
        if (deliveryType === 'printed' && shippingCosts && governorate) {
          const egyptCosts = shippingCosts['مصر'] || shippingCosts;
          shippingPrice =
            egyptCosts[governorate] || egyptCosts['باقي المحافظات'] || egyptCosts['default'] || 0;
        }

        return (
          <div className="bg-muted/30 py-12 sm:py-16 min-h-screen">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                  <h1 className="text-3xl font-extrabold text-foreground mb-2 flex items-center gap-3">
                    {product.title}
                    {isLibraryBook && (
                      <span className="text-sm font-normal bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1">
                        <Library size={12} /> مكتبة الرحلة
                      </span>
                    )}
                  </h1>
                  <OrderStepper steps={steps} currentStep={currentStepKey} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                  <div className="lg:col-span-2 space-y-6">
                    <Card>
                      <CardContent className="pt-6">
                        {currentStepKey === 'child' && (
                          <>
                            <ChildDetailsSection
                              form={form}
                              childProfiles={childProfiles}
                              onSelectChild={(child) => setSelectedChildId(child ? child.id : null)}
                              selectedChildId={selectedChildId}
                              currentUser={currentUser}
                              onAddChild={handleAddChild}
                            />
                            {/* Library books intentionally expose cover-only personalization. */}
                            {isLibraryBook && (
                              <div className="mt-8 border-t pt-6">
                                <LibraryCoverPersonalizationSection
                                  form={form}
                                  textFields={product.text_fields || []}
                                  imageSlots={product.image_slots || []}
                                />
                              </div>
                            )}
                          </>
                        )}
                        {currentStepKey === 'story' && !isLibraryBook && (
                          <>
                            <StoryCustomizationSection
                              form={form}
                              textFields={product.text_fields || []}
                              goalConfig={product.goal_config}
                              storyGoals={storyGoals}
                            />
                            <div className="mt-8 border-t pt-6">
                              <ImageUploadSection
                                form={form}
                                imageSlots={product.image_slots || []}
                              />
                            </div>
                          </>
                        )}
                        {currentStepKey === 'addons' && journey === 'custom' && (
                          <AddonsSection
                            addonProducts={availableAddonProducts}
                            selectedAddons={selectedAddons}
                            deliveryType={deliveryType}
                            onToggle={(key) =>
                              setSelectedAddons((prev) =>
                                prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
                              )
                            }
                          />
                        )}
                        {currentStepKey === 'delivery' && (
                          <DeliverySection form={form} product={product} />
                        )}
                        {currentStepKey === 'review' && (
                          <div className="space-y-4">
                            <h3 className="text-xl font-bold">مراجعة نهائية</h3>

                            {!isLoggedIn && (
                              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 text-orange-800 flex items-center gap-3">
                                <LogIn size={20} />
                                <div>
                                  <p className="font-bold">تنبيه: يجب تسجيل الدخول للمتابعة</p>
                                  <p className="text-sm">
                                    لن تتمكن من إضافة الطلب للسلة دون تسجيل الدخول.
                                  </p>
                                </div>
                                <Button
                                  asChild
                                  size="sm"
                                  variant="outline"
                                  className="mr-auto bg-white"
                                >
                                  <Link href="/account">تسجيل الدخول</Link>
                                </Button>
                              </div>
                            )}

                            <p className="text-muted-foreground">
                              يرجى التأكد من صحة جميع البيانات قبل الإضافة للسلة.
                            </p>
                            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-sm text-yellow-800">
                              <p>
                              بمجرد تأكيد الطلب، سيتم تجهيز{' '}
                                {isLibraryBook ? 'كتابك المختار مع غلافه المخصص' : 'تجربتك وقصتك المخصصة'}.
                              </p>
                            </div>
                            {deliveryType === 'printed' &&
                              (!governorate || shippingPrice === 0) && (
                                <div
                                  className="bg-red-50 p-4 rounded-lg border border-red-200 text-red-700 text-sm"
                                  role="alert"
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                    <p className="font-bold flex-1">
                                      تنبيه: لم يتم تحديد المحافظة أو حساب الشحن. يرجى تحديد
                                      المحافظة للمتابعة.
                                    </p>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      className="border-red-300 bg-white text-red-700 hover:bg-red-100"
                                      onClick={goToDeliveryStep}
                                    ></Button>
                                  </div>
                                </div>
                              )}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <div className="flex justify-between mt-6">
                      <Button
                        onClick={handleBack}
                        disabled={step === 0}
                        variant="outline"
                        icon={<ArrowRight size={16} />}
                      >
                        السابق
                      </Button>

                      {step === steps.length - 1 ? (
                        <div className="flex flex-wrap items-center gap-3">
                          <Button
                            asChild
                            variant="outline"
                            className="border-primary text-primary hover:bg-primary/5"
                          >
                            <Link href="/cart">الانتقال إلى السلة</Link>
                          </Button>
                          <Button
                            onClick={() => form.handleSubmit()}
                            loading={isSubmitting}
                            icon={<ArrowLeft size={16} />}
                            variant="success"
                            className="min-w-36"
                            disabled={!isLoggedIn}
                          >
                            تأكيد الطلب
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={handleNext}
                          icon={<ArrowLeft size={16} />}
                          className="w-32"
                        >
                          التالي
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="lg:col-span-1 sticky top-24">
                    <OrderPreview
                      form={form}
                      product={product}
                      basePrice={basePrice}
                      addons={addonsList}
                      totalPrice={totalPrice}
                      shippingPrice={shippingPrice}
                      storyGoals={storyGoals}
                      journey={journey}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }}
    </form.Subscribe>
  );
};

export default OrderPage;
