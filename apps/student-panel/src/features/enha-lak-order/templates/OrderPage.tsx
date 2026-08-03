"use client";


import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from '@tanstack/react-form';
import { useOrderData } from '../../../hooks/queries/public/usePageDataQuery';
import { useAuth } from '../../../contexts/AuthContext';
import { useCart } from '../../../contexts/CartContext';
import { useProduct } from '../../../contexts/ProductContext';
import { useToast } from '../../../contexts/ToastContext';
import { createOrderSchema, OrderFormValues } from '../../../lib/schemas';
import PageLoader from '@alrehla/ui/page-loader';
import { Button } from '@alrehla/ui/button';
import OrderStepper from '../../../components/order/OrderStepper';
import ChildDetailsSection from '../../../components/order/ChildDetailsSection';
import StoryCustomizationSection from '../../../components/order/StoryCustomizationSection';
import ImageUploadSection from '../../../components/order/ImageUploadSection';
import AddonsSection from '../../../components/order/AddonsSection';
import DeliverySection from '../../../components/order/DeliverySection';
import InteractivePreview from '../../../components/order/InteractivePreview';
import { Card, CardContent } from '@alrehla/ui/card';
import { ArrowLeft, ArrowRight, Library, LogIn } from 'lucide-react';
import { EGYPTIAN_GOVERNORATES } from '../../../utils/governorates';
import type { OrderFormApi } from '../../../components/order/form-types';

interface OrderPreviewValuesProps {
    values: OrderFormValues;
    product: any;
    form: OrderFormApi;
    basePrice: number;
    addons: { key: string; title: string; price: number }[];
    totalPrice: number;
    shippingPrice: number;
}

const OrderPreviewValues: React.FC<OrderPreviewValuesProps> = ({ values, product, form, basePrice, addons, totalPrice, shippingPrice }) => {
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        const imageFile = product?.image_slots?.map((slot: any) => values[slot.id]).find((value: unknown) => typeof File !== 'undefined' && value instanceof File) as File | undefined;
        if (!imageFile) {
            setImagePreviewUrl(null);
            return;
        }
        const objectUrl = URL.createObjectURL(imageFile);
        setImagePreviewUrl(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [product, values]);

    return (
        <InteractivePreview
            formData={{ ...values, childName: values.childName || '', childTraits: values.childTraits || '', storyValue: values.storyValue || '', customGoal: values.customGoal || '' }}
            product={product}
            basePrice={basePrice}
            addons={addons}
            totalPrice={totalPrice}
            shippingPrice={shippingPrice}
            imagePreviewUrl={imagePreviewUrl}
            storyGoals={product?.story_goals || []}
        />
    );
};

const OrderPreview: React.FC<Omit<OrderPreviewValuesProps, 'values'>> = (props) => (
    <props.form.Subscribe selector={(state: any) => state.values}>
        {(values: OrderFormValues) => <OrderPreviewValues {...props} values={values} />}
    </props.form.Subscribe>
);

const OrderPage: React.FC = () => {
    const { productKey } = useParams<{ productKey: string }>();
    const router = useRouter();
    const { addItemToCart } = useCart();
    const { addToast } = useToast();
    const { isLoggedIn, currentUser, childProfiles, isProfileComplete, triggerProfileUpdate } = useAuth();
    const { shippingCosts } = useProduct();
    const { data, isLoading } = useOrderData();

    const [step, setStep] = useState(0);
    const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
    const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Get current product
    const product = useMemo(() => 
        data?.personalizedProducts.find(p => p.key === productKey), 
    [data, productKey]);

    const addonProducts = useMemo(() => 
        data?.personalizedProducts.filter(p => p.is_addon) || [],
    [data]);

    const submitRef = useRef<(data: OrderFormValues) => Promise<void>>();
    const invalidSubmitRef = useRef<(formApi: any) => void>();
    const orderSchema = useMemo(() => createOrderSchema(product), [product]);
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
            shippingOption: 'my_address'
        }
    });

    const formData = form.state.values as OrderFormValues;

    // --- Dynamic Steps Logic ---
    const isLibraryBook = product?.product_type === 'library_book';

    const steps = useMemo(() => {
        const baseSteps = [
            { key: 'child', title: 'بيانات الطفل' },
             // Only show story customization for Hero Stories
            !isLibraryBook ? { key: 'story', title: 'تخصيص القصة' } : null,
            { key: 'addons', title: 'إضافات' },
            { key: 'delivery', title: 'الشحن' },
            { key: 'review', title: 'المراجعة' },
        ];
        return baseSteps.filter(Boolean) as { key: string; title: string }[];
    }, [isLibraryBook]);

    // Reset form when child is selected
    useEffect(() => {
        if (selectedChildId) {
            const child = childProfiles.find(c => c.id === selectedChildId);
            if (child) {
                form.setFieldValue('childName', child.name);
                form.setFieldValue('childBirthDate', child.birth_date);
                form.setFieldValue('childGender', child.gender);
            }
        }
    }, [selectedChildId, childProfiles, form]);
    
    // Auto-fill shipping if user is logged in
    useEffect(() => {
        if (isLoggedIn && currentUser && form.getFieldValue('shippingOption') === 'my_address') {
            form.setFieldValue('recipientName', currentUser.name || '');
            form.setFieldValue('recipientAddress', currentUser.address || '');
            form.setFieldValue('recipientPhone', currentUser.phone || '');
            form.setFieldValue('recipientEmail', currentUser.email || '');
            const gov = currentUser.governorate || (currentUser.city && EGYPTIAN_GOVERNORATES.includes(currentUser.city) ? currentUser.city : '');
            form.setFieldValue('governorate', gov);
        }
    }, [isLoggedIn, currentUser, form]);

    if (isLoading) return <PageLoader text="جاري تحميل المنتج..." />;
    if (!product) return <div className="text-center py-20">المنتج غير موجود</div>;

    // Calculations
    const basePrice = (formData.deliveryType === 'electronic' ? product.price_electronic : product.price_printed) || 0;
    
    const addonsPrice = selectedAddons.reduce((sum, addonKey) => {
        const addon = addonProducts.find(p => p.key === addonKey);
        if (!addon) return sum;
        const price = formData.deliveryType === 'electronic' ? addon.price_electronic : addon.price_printed;
        return sum + (price || 0);
    }, 0);

    const totalPrice = basePrice + addonsPrice;

    let shippingPrice = 0;
    if (formData.deliveryType === 'printed' && shippingCosts) {
        const gov = formData.governorate;
        if (gov) {
            const egyptCosts = shippingCosts['مصر'] || {};
            shippingPrice = egyptCosts[gov] || egyptCosts['باقي المحافظات'] || 0;
        }
    }

    const currentStepKey = steps[step].key;

    const handleNext = async () => {
        const currentFormData = form.state.values as OrderFormValues;
        let fieldsToValidate: any[] = [];
        
        if (currentStepKey === 'child') {
            fieldsToValidate = ['childName', 'childBirthDate', 'childGender'];
            // Fix: For Library Books, images are uploaded in the Child step
            if (isLibraryBook && product.image_slots) {
                const imageFields = product.image_slots.map(slot => slot.id);
                fieldsToValidate = [...fieldsToValidate, ...imageFields];
            }
        }
        
        // Validation for story customization only if step exists
        if (currentStepKey === 'story' && !isLibraryBook) {
             fieldsToValidate = ['storyValue', 'customGoal'];
             if (product.text_fields) {
                 fieldsToValidate = [...fieldsToValidate, ...product.text_fields.filter(f => f.required).map(f => f.id)];
             }
             // Fix: For Hero Stories, images are uploaded in the Story step
             if (product.image_slots) {
                const imageFields = product.image_slots.map(slot => slot.id);
                fieldsToValidate = [...fieldsToValidate, ...imageFields];
            }
        }
        
        if (currentStepKey === 'delivery' && currentFormData.deliveryType === 'printed') {
            fieldsToValidate = ['recipientName', 'recipientAddress', 'recipientPhone', 'governorate'];
            if(currentFormData.sendDigitalCard) fieldsToValidate.push('recipientEmail');
        }

        const validationErrors = await form.validate('change', {
            filterFieldNames: (fieldName: string) => fieldsToValidate.includes(fieldName),
        });
        const isValid = Object.keys(validationErrors).length === 0;
        if (isValid) {
            setStep(prev => prev + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
             // Optional: visual feedback if validation fails silently (though fields usually turn red)
             if (!isLibraryBook && currentStepKey === 'story' || isLibraryBook && currentStepKey === 'child') {
                 // Check if image errors exist
                 if (product.image_slots?.some(slot => form.getFieldMeta(slot.id)?.errors?.length)) {
                     addToast("يرجى رفع الصور المطلوبة للمتابعة.", "error");
                 }
             }
             addToast("يرجى إكمال البيانات المطلوبة في هذه الخطوة.", "warning");
        }
    };

    const handleBack = () => {
        setStep(prev => prev - 1);
    };
    
    // Redirect to Family Center
    const handleAddChild = () => {
        router.push('/account?tab=familyCenter');
    };

    const onError = (formApi: any) => {
        const fieldMeta = formApi.state.fieldMeta || {};
        const errors = Object.entries(fieldMeta).reduce((result: Record<string, any>, [fieldName, meta]: [string, any]) => {
            const error = meta?.errors?.[0];
            if (error) result[fieldName] = typeof error === 'string' ? error : error.message;
            return result;
        }, {});
        console.error("Form Validation Errors:", errors);
        const errorMessages = Object.values(errors).join('، ');
        addToast(`عذراً، يوجد بيانات ناقصة: ${errorMessages.substring(0, 50)}...`, "error");
        
        // محاولة العودة للخطوة التي تحتوي على الخطأ (بسيط)
        if(errors.childName || errors.childBirthDate) {
             const childStep = steps.findIndex(s => s.key === 'child');
             if(step !== childStep) setStep(childStep);
        } else if (errors.recipientAddress || errors.governorate) {
             const deliveryStep = steps.findIndex(s => s.key === 'delivery');
             if(step !== deliveryStep) setStep(deliveryStep);
        }
    };

    const onSubmit = async (data: OrderFormValues) => {
        // 1. Strict Login Check
        if (!isLoggedIn) {
            addToast('يجب تسجيل الدخول لإتمام الطلب وإضافته للسلة.', 'info');
            router.push('/account');
            return;
        }

        // 2. Profile Completion Check
        if (!isProfileComplete) {
            triggerProfileUpdate(true); 
            return;
        }

        // 3. Strict Shipping & Address Check for Printed Items
        if (data.deliveryType === 'printed') {
            if (!data.governorate || data.governorate.trim() === '') {
                 addToast('عذراً، يجب تحديد المحافظة لحساب تكلفة الشحن.', 'error');
                 const deliveryStepIndex = steps.findIndex(s => s.key === 'delivery');
                 setStep(deliveryStepIndex);
                 return;
            }
            if (!data.recipientAddress || data.recipientAddress.trim() === '') {
                addToast('العنوان التفصيلي مطلوب للتوصيل.', 'error');
                const deliveryStepIndex = steps.findIndex(s => s.key === 'delivery');
                setStep(deliveryStepIndex);
                return;
            }

            // إعادة حساب الشحن للتأكد
            let calculatedShipping = 0;
            if (shippingCosts && data.governorate) {
                const egyptCosts = shippingCosts['مصر'] || {};
                calculatedShipping = egyptCosts[data.governorate] || egyptCosts['باقي المحافظات'] || 0;
            }

            if (calculatedShipping <= 0) {
                 console.warn("Shipping cost is 0 or missing, defaulting to safe fallback or blocking.");
                 if (shippingCosts && Object.keys(shippingCosts).length > 0) {
                     addToast('حدث خطأ في حساب الشحن للمحافظة المختارة.', 'error');
                     return;
                 }
            }
        }

        setIsSubmitting(true);
        
        try {
            const files: Record<string, File> = {};
            if (product.image_slots) {
                product.image_slots.forEach(slot => {
                    if ((data as any)[slot.id] instanceof File) {
                        files[slot.id] = (data as any)[slot.id];
                    }
                });
            }
            
            let finalShippingPrice = 0;
            if (data.deliveryType === 'printed' && shippingCosts) {
                 const egyptCosts = shippingCosts['مصر'] || {};
                 finalShippingPrice = egyptCosts[data.governorate || ''] || egyptCosts['باقي المحافظات'] || 0;
            }

            const currentBasePrice = (data.deliveryType === 'electronic' ? product.price_electronic : product.price_printed) || 0;
            const currentAddonsPrice = selectedAddons.reduce((sum, addonKey) => {
                const addon = addonProducts.find(p => p.key === addonKey);
                if (!addon) return sum;
                const price = data.deliveryType === 'electronic' ? addon.price_electronic : addon.price_printed;
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
                        childId: selectedChildId 
                    }
                }
            });

            addToast('تمت إضافة الطلب للسلة بنجاح!', 'success');
            router.push('/cart');
        } catch (error) {
            console.error("Cart Error", error);
            addToast('حدث خطأ أثناء الإضافة للسلة. يرجى المحاولة مرة أخرى.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    submitRef.current = onSubmit;
    invalidSubmitRef.current = onError;

    return (
        <form.Subscribe selector={(state: any) => state.values}>
            {(values: OrderFormValues) => {
                const formData = values;
                const basePrice = (formData.deliveryType === 'electronic' ? product.price_electronic : product.price_printed) || 0;
                const addonsPrice = selectedAddons.reduce((sum, addonKey) => {
                    const addon = addonProducts.find(p => p.key === addonKey);
                    if (!addon) return sum;
                    const price = formData.deliveryType === 'electronic' ? addon.price_electronic : addon.price_printed;
                    return sum + (price || 0);
                }, 0);
                const totalPrice = basePrice + addonsPrice;
                let shippingPrice = 0;
                if (formData.deliveryType === 'printed' && shippingCosts && formData.governorate) {
                    const egyptCosts = shippingCosts['مصر'] || {};
                    shippingPrice = egyptCosts[formData.governorate] || egyptCosts['باقي المحافظات'] || 0;
                }

                return <div className="bg-muted/30 py-12 sm:py-16 min-h-screen">
                <div className="container mx-auto px-4">
                    <div className="max-w-6xl mx-auto">
                        <div className="mb-8">
                            <h1 className="text-3xl font-extrabold text-foreground mb-2 flex items-center gap-3">
                                {product.title}
                                {isLibraryBook && <span className="text-sm font-normal bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1"><Library size={12}/> مكتبة الرحلة</span>}
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
                                            {/* Show basic cover customization for Library Books here since Story step is skipped */}
                                            {isLibraryBook && (
                                                <div className="mt-8 border-t pt-6">
                                                    <h4 className="text-lg font-bold text-gray-800 mb-4">تخصيص الغلاف</h4>
                                                <ImageUploadSection form={form} imageSlots={product.image_slots || []} />
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
                                                    storyGoals={product.story_goals || []}
                                                />
                                                <div className="mt-8 border-t pt-6">
                                                    <ImageUploadSection form={form} imageSlots={product.image_slots || []} />
                                                </div>
                                            </>
                                        )}
                                        {currentStepKey === 'addons' && (
                                            <AddonsSection 
                                                addonProducts={addonProducts}
                                                selectedAddons={selectedAddons}
                                                onToggle={(key) => setSelectedAddons(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])}
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
                                                            <p className="text-sm">لن تتمكن من إضافة الطلب للسلة دون تسجيل الدخول.</p>
                                                        </div>
                                                        <Button asChild size="sm" variant="outline" className="mr-auto bg-white"><Link href="/account">تسجيل الدخول / إنشاء حساب</Link></Button>
                                                    </div>
                                                )}

                                                <p className="text-muted-foreground">يرجى التأكد من صحة جميع البيانات قبل الإضافة للسلة.</p>
                                                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-sm text-yellow-800">
                                                    <p>بمجرد تأكيد الطلب، سيتم البدء في تجهيز {isLibraryBook ? 'كتابك المختار' : 'قصتك المخصصة'}.</p>
                                                </div>
                                                {formData.deliveryType === 'printed' && (!formData.governorate || shippingPrice === 0) && (
                                                    <div className="bg-red-50 p-3 rounded border border-red-200 text-red-700 font-bold text-sm">
                                                        تنبيه: لم يتم تحديد المحافظة أو حساب الشحن. يرجى العودة لخطوة الشحن.
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
                                        <Button 
                                            onClick={() => form.handleSubmit()}
                                            loading={isSubmitting} 
                                            icon={<ArrowLeft size={16} />}
                                            variant="success"
                                            className="w-40"
                                            disabled={!isLoggedIn} 
                                        >
                                            إضافة للسلة
                                        </Button>
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
                                <OrderPreview form={form} product={product} basePrice={basePrice} addons={selectedAddons.map(key => {
                                        const p = addonProducts.find(ap => ap.key === key);
                                        return { key, title: p?.title || '', price: (formData.deliveryType === 'electronic' ? p?.price_electronic : p?.price_printed) || 0 };
                                    })} totalPrice={totalPrice} shippingPrice={shippingPrice} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>;
            }}
        </form.Subscribe>
    );
};

export default OrderPage;
