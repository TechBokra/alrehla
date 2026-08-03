"use client";


import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '../../../contexts/CartContext';
import { useOrderMutations } from '../../../hooks/mutations/useOrderMutations';
import { useUserMutations } from '../../../hooks/mutations/useUserMutations';
import { useSubscriptionMutations } from '../../../hooks/mutations/useSubscriptionMutations';
import { useBookingMutations } from '../../../hooks/mutations/useBookingMutations';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { Button } from '@alrehla/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@alrehla/ui/card';
import { CheckCircle, AlertCircle, ShoppingBag, Truck, CreditCard, Send, User } from 'lucide-react';
import ReceiptUpload from '../../../components/shared/ReceiptUpload';
import { usePublicData } from '../../../hooks/queries/public/usePublicDataQuery';
import { storageService } from '../../../services/storageService';
import Image from '@alrehla/ui/next-image';

const CheckoutPage: React.FC = () => {
    const router = useRouter();
    const { cart, clearCart, getCartTotal } = useCart();
    const { currentUser, isProfileComplete, triggerProfileUpdate, currentChildProfile, childProfiles } = useAuth();
    const { addToast } = useToast();
    const { createOrder } = useOrderMutations();
    const { createChildProfile } = useUserMutations();
    const { createSubscription } = useSubscriptionMutations();
    const { createBooking } = useBookingMutations();
    const { data: publicData } = usePublicData();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [copied, setCopied] = useState(false);

    const isStudent = currentUser?.role === 'student';

    // Enforce Profile Check on Mount (Skip for students as their parent handles profile data mostly)
    React.useEffect(() => {
        if (currentUser && !isStudent && !isProfileComplete) {
            triggerProfileUpdate(true);
        }
    }, [currentUser, isProfileComplete, triggerProfileUpdate, isStudent]);

    // Payment Info from Backend
    const instapayNumber = publicData?.communicationSettings?.instapay_number;
    const instapayUrl = publicData?.communicationSettings?.instapay_url;
    const instapayQrUrl = publicData?.communicationSettings?.instapay_qr_url;

    if (cart.length === 0) {
        return (
            <div className="container mx-auto py-20 text-center">
                <h2 className="text-2xl font-bold mb-4">السلة فارغة</h2>
                <Button asChild><Link href="/">العودة للتسوق</Link></Button>
            </div>
        );
    }

    const ensureChildId = async (childData: any) => {
        // 1. Check if ID exists directly in the passed data
        if (childData.id && childData.id !== -1) return childData.id;
        if (childData.childId && childData.childId !== -1) return childData.childId;

        // 2. Intelligent Check: Look for existing child with the exact same name in user's profile
        // This prevents duplicate creation if the user selected a child but ID wasn't passed correctly,
        // or if they typed the name of an existing child.
        const nameToFind = (childData.name || childData.childName || '').trim();
        if (nameToFind && childProfiles.length > 0) {
            const existingChild = childProfiles.find(c => c.name.trim() === nameToFind);
            if (existingChild) {
                return existingChild.id;
            }
        }
        
        // 3. If child doesn't exist, create profile first
        // Note: Students shouldn't reach here for creating profiles usually, but safe to keep
        const newChild = await createChildProfile.mutateAsync({
            name: childData.name || childData.childName,
            birth_date: childData.birth_date || childData.childBirthDate,
            gender: childData.gender || childData.childGender
        });
        return newChild.id;
    };

    const processCartItem = async (item: any, receiptUrl: string | undefined) => {
        if (!currentUser) throw new Error('User not authenticated');
        
        // تحديد هوية "صاحب الطلب" (Payer ID)
        // إذا كان المستخدم طالب، فالمالك هو ولي الأمر (الموجود في currentChildProfile.user_id)
        // إذا كان مستخدم عادي/ولي أمر، فهو المستخدم نفسه
        let payerUserId = currentUser.id;
        if (isStudent && currentChildProfile?.user_id) {
            payerUserId = currentChildProfile.user_id;
        }

        // 1. Service Order
        if (item.type === 'order' && (item.payload.productKey?.startsWith('service_') || item.payload.details?.serviceId)) {
            let fileUrl = null;
            if (item.payload.files?.service_file) {
                 fileUrl = await storageService.uploadFile(item.payload.files.service_file, 'receipts', `service_files/${payerUserId}`);
            }
            
            return createOrder.mutateAsync({
                userId: payerUserId,
                childId: item.payload.childId || (await ensureChildId(item.payload.details?.child || { name: 'Service Request', birth_date: '2000-01-01', gender: 'ذكر' })), 
                summary: item.payload.summary,
                total: item.payload.totalPrice,
                shippingCost: 0,
                productKey: item.payload.productKey,
                details: { ...item.payload.details, fileUrl },
                receiptUrl
            });
        }
        
        // 2. Product Order
        if (item.type === 'order') {
            const childId = await ensureChildId(item.payload.formData || item.payload.details);
            
            const uploadedImages: Record<string, string> = {};
            if (item.payload.files) {
                 for (const [key, file] of Object.entries(item.payload.files as Record<string, File>)) {
                     const url = await storageService.uploadFile(file, 'receipts', `custom_images/${payerUserId}`);
                     uploadedImages[key] = url;
                 }
            }

            // Inject productKey into details for easier access in admin panel
            const finalDetails = {
                ...item.payload.details,
                ...uploadedImages,
                productKey: item.payload.productKey
            };

            const shippingCost = item.payload.shippingPrice || 0;
            const itemsTotal = item.payload.totalPrice || 0;
            const finalTotal = itemsTotal + shippingCost;

            return createOrder.mutateAsync({
                userId: payerUserId,
                childId,
                summary: item.payload.summary,
                total: finalTotal,
                shippingCost: shippingCost,
                productKey: item.payload.productKey,
                details: finalDetails,
                receiptUrl
            });
        }

        // 3. Subscription
        if (item.type === 'subscription') {
            const childId = await ensureChildId(item.payload.formData);
            const sub = await createSubscription.mutateAsync({
                userId: payerUserId,
                childId,
                planName: item.payload.planName,
                durationMonths: item.payload.durationMonths
            });
            return createOrder.mutateAsync({
                userId: payerUserId,
                childId,
                summary: item.payload.summary,
                total: item.payload.totalPrice + (item.payload.shippingPrice || 0),
                shippingCost: item.payload.shippingPrice || 0,
                productKey: 'subscription_payment',
                details: { subscriptionId: sub.id, ...item.payload.details },
                receiptUrl
            });
        }

        // 4. Booking
        if (item.type === 'booking') {
            const childId = await ensureChildId(item.payload.child);
            const bookingPayload = {
                ...item.payload,
                child: { ...item.payload.child, id: childId }
            };
            
            return createBooking.mutateAsync({
                userId: payerUserId,
                payload: bookingPayload,
                receiptUrl: receiptUrl || '' // Booking mutation expects string, empty is treated as pending payment
            });
        }
    };

    const handleCheckout = async () => {
        // Validation for non-students (receipt required)
        if (!isStudent && !receiptFile) {
            addToast('يرجى رفع إيصال الدفع.', 'warning');
            return;
        }

        setIsSubmitting(true);
        try {
            let receiptUrl: string | undefined = undefined;

            // Upload Receipt Only if User provided it (Student won't)
            if (receiptFile) {
                receiptUrl = await storageService.uploadFile(receiptFile, 'receipts', `payments/${currentUser?.id}`);
            }

            // Process all items
            const promises = cart.map(item => processCartItem(item, receiptUrl));
            await Promise.all(promises);

            clearCart();
            
            if (isStudent) {
                router.push('/payment-status?status=request_sent');
            } else {
                router.push('/payment-status?status=success_review');
            }
        } catch (error: any) {
            console.error("Checkout Error:", error);
            addToast(`حدث خطأ أثناء المعالجة: ${error.message}`, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleCopyNumber = () => {
        if(instapayNumber) {
            navigator.clipboard.writeText(instapayNumber);
            setCopied(true);
            addToast('تم نسخ الرقم', 'success');
        }
    }

    const totalAmount = getCartTotal();

    return (
        <div className="bg-gray-50 py-12 sm:py-16 min-h-screen animate-fadeIn">
            <div className="container mx-auto px-4 max-w-4xl">
                <h1 className="text-3xl font-extrabold text-gray-900 mb-8">
                    {isStudent ? 'تأكيد الطلب وإرساله' : 'إتمام الطلب والدفع'}
                </h1>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Items Summary */}
                    <div className="md:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><ShoppingBag /> ملخص الطلبات</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {cart.map(item => (
                                    <div key={item.id} className="flex items-center gap-4 border-b pb-4 last:border-0 last:pb-0">
                                        <div>
                                            <p className="font-bold">{item.payload.summary}</p>
                                            {item.payload.shippingPrice > 0 && (
                                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Truck size={12}/> شامل الشحن ({item.payload.shippingPrice} ج.م)
                                                </p>
                                            )}
                                        </div>
                                        <p className="font-bold text-primary">
                                            {(item.payload.total || item.payload.totalPrice || 0) + (item.payload.shippingPrice || 0)} ج.م
                                        </p>
                                    </div>
                                ))}
                                <div className="pt-4 mt-4 border-t flex justify-between items-center text-xl font-black text-gray-900">
                                    <span>الإجمالي المستحق</span>
                                    <span>{totalAmount} ج.م</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Payment / Request Action */}
                    <div className="md:col-span-1 space-y-6">
                        {isStudent ? (
                            <Card className="bg-purple-50 border-purple-200">
                                <CardHeader>
                                    <CardTitle className="text-purple-900 flex items-center gap-2">
                                        <User /> طلب موافقة ولي الأمر
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-sm text-purple-800 leading-relaxed">
                                        سيتم إرسال هذا الطلب إلى حساب ولي أمرك <strong>{currentChildProfile?.parentName || 'المسؤول'}</strong>.
                                    </p>
                                    <div className="bg-white p-3 rounded border border-purple-100 text-xs text-gray-600">
                                        <p>سيقوم ولي الأمر بمراجعة الطلب وإتمام عملية الدفع لتأكيده.</p>
                                    </div>

                                    <Button 
                                        onClick={handleCheckout} 
                                        loading={isSubmitting} 
                                        className="w-full mt-4" 
                                        size="lg"
                                        variant="default" // Using default primary color for request
                                        icon={<Send size={18} />}
                                    >
                                        إرسال الطلب للاعتماد
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className="bg-blue-50 border-blue-200">
                                <CardHeader>
                                    <CardTitle className="text-blue-900 flex items-center gap-2">
                                        <CreditCard /> تعليمات الدفع
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-sm text-blue-800">
                                        يرجى تحويل المبلغ الإجمالي <strong>({totalAmount} ج.م)</strong> عبر Instapay أو المحافظ الإلكترونية.
                                    </p>
                                    
                                    {instapayQrUrl && (
                                        <div className="flex justify-center bg-white p-2 rounded-lg border">
                                            <Image src={instapayQrUrl} alt="QR Code" className="w-32 h-32 object-contain" />
                                        </div>
                                    )}
                                    
                                    {instapayNumber && (
                                        <div className="bg-white p-3 rounded border flex justify-between items-center">
                                            <span className="font-mono font-bold text-lg dir-ltr">{instapayNumber}</span>
                                            <Button size="icon" variant="ghost" onClick={handleCopyNumber} className="h-8 w-8">
                                                {copied ? <CheckCircle size={16} className="text-green-500"/> : <span className="text-xs font-bold">نسخ</span>}
                                            </Button>
                                        </div>
                                    )}
                                    
                                    <div className="text-xs text-blue-700 mt-2">
                                        <AlertCircle size={14} className="inline mr-1" />
                                        بعد التحويل، يرجى رفع صورة الإيصال (Screenshot) أدناه لتأكيد طلبك.
                                    </div>

                                    <div className="pt-4 border-t border-blue-200">
                                        <label className="block text-sm font-bold text-blue-900 mb-2">إيصال الدفع</label>
                                        <ReceiptUpload file={receiptFile} setFile={setReceiptFile} disabled={isSubmitting} />
                                    </div>

                                    <Button 
                                        onClick={handleCheckout} 
                                        loading={isSubmitting} 
                                        disabled={!receiptFile || isSubmitting}
                                        className="w-full mt-4" 
                                        size="lg"
                                        variant="success"
                                    >
                                        تأكيد الطلب
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
