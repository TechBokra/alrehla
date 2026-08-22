'use client';

import React from 'react';
import { Button } from '@alrehla/ui/button';
import { Card, CardContent } from '@alrehla/ui/card';
import { Input } from '@alrehla/ui/input';
import FormField from '@alrehla/ui/form-field';
import AddonsSection from '../../../components/order/AddonsSection';
import ChildDetailsSection from '../../../components/order/ChildDetailsSection';
import OrderStepper from '../../../components/order/OrderStepper';
import ShippingAddressForm from '../../../components/shared/ShippingAddressForm';
import SubscriptionSummary from '../../../components/subscription/SubscriptionSummary';
import { useSubscriptionPage } from '../hooks/useSubscriptionPage';
import SubscriptionPlanSelection from '../components/SubscriptionPlanSelection';
import type { EnhaLakSubscriptionData } from '../../../services/enhaLakPublicService';
import { subscriptionSteps } from '../types';

interface SubscriptionPageProps {
  initialData: EnhaLakSubscriptionData;
}

const SubscriptionPage: React.FC<SubscriptionPageProps> = ({ initialData }) => {
  const {
    form,
    plans,
    addonProducts,
    boxContent,
    childProfiles,
    currentUser,
    step,
    currentStepKey,
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
  } = useSubscriptionPage({ initialData });

  return (
    <div className="min-h-screen animate-fadeIn bg-gray-50 py-16">
      <div className="container mx-auto max-w-5xl px-4">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-extrabold text-foreground">
            {boxContent?.heroTitle || 'صندوق الرحلة الشهري'}
          </h1>
          <p className="mt-2 text-muted-foreground">{boxContent?.heroSubtitle}</p>
        </div>

        <OrderStepper
          steps={[...subscriptionSteps]}
          currentStep={currentStepKey}
        />

        <div className="mt-10 grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <Card>
              <CardContent className="pt-6">
                {currentStepKey === 'plan' && (
                  <SubscriptionPlanSelection
                    plans={plans}
                    selectedPlanId={selectedPlanId}
                    onSelect={selectPlan}
                    error={planError}
                  />
                )}

                {currentStepKey === 'child' && (
                  <div className="space-y-6">
                    <ChildDetailsSection
                      form={form}
                      childProfiles={childProfiles}
                      onSelectChild={handleChildSelect}
                      selectedChildId={selectedChildId}
                      currentUser={currentUser}
                      onAddChild={handleAddChild}
                    />

                    <div className="grid grid-cols-1 gap-4 border-t pt-4 md:grid-cols-2">
                      <form.Field name="childInterests">
                        {(field: any) => (
                          <FormField
                            label="اهتمامات الطفل (يساعدنا في اختيار محتوى الصندوق)"
                            htmlFor="childInterests"
                            className="md:col-span-2"
                          >
                            <Input
                              id="childInterests"
                              type="text"
                              value={field.state.value || ''}
                              onChange={(event) => field.handleChange(event.target.value)}
                              onBlur={field.handleBlur}
                              className="w-full rounded-md border p-2"
                              placeholder="فضاء، حيوانات، رسم..."
                            />
                          </FormField>
                        )}
                      </form.Field>
                    </div>
                  </div>
                )}

                {currentStepKey === 'addons' && (
                  <AddonsSection
                    addonProducts={addonProducts}
                    selectedAddons={selectedAddons}
                    onToggle={toggleAddon}
                  />
                )}

                {currentStepKey === 'delivery' && <ShippingAddressForm form={form} />}
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button type="button" onClick={handleBack} disabled={step === 0} variant="outline">
                السابق
              </Button>
              {step < 3 && (
                <Button type="button" onClick={() => void handleNext()}>
                  التالي
                </Button>
              )}
            </div>
          </div>

          <div className="sticky top-24 lg:col-span-1">
            <form.Subscribe selector={(state: any) => state.values.governorate}>
              {(governorate: string) => (
                <SubscriptionSummary
                  selectedPlan={selectedPlan}
                  isSubmitting={isSubmitting}
                  onSubmit={() => void handleSubmit()}
                  step={currentStepKey}
                  features={boxContent?.features}
                  shippingCost={getShippingPrice(governorate)}
                  addonsCost={getAddonsCost()}
                  selectedAddons={selectedAddons}
                  addonProducts={addonProducts}
                  governorate={governorate}
                />
              )}
            </form.Subscribe>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
