"use client";


import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from '@/lib/router-compat';
import { usePublicData } from '../../../hooks/queries/public/usePublicDataQuery';
import { useCart } from '../../../contexts/CartContext';
import { useToast } from '../../../contexts/ToastContext';
import { useAuth } from '../../../contexts/AuthContext';
import PageLoader from '../../../components/ui/PageLoader';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../../components/ui/card';
import { Button } from '../../../components/ui/Button';
import { ArrowLeft, Upload, FileText, CheckCircle, Info } from 'lucide-react';
import ReceiptUpload from '../../../components/shared/ReceiptUpload';
import FormField from '../../../components/ui/FormField';
import { Textarea } from '../../../components/ui/Textarea';
import Image from '../../../components/ui/Image';
import { calculateCustomerPrice } from '../../../utils/pricingCalculator';

const ServiceOrderPage: React.FC = () => {
    const { serviceId } = useParams<{ serviceId: string }>();
    const [searchParams] = useSearchParams();
    const instructorId = searchParams.get('instructorId');
    
    const navigate = useNavigate();
    const { addItemToCart } = useCart();
    const { addToast } = useToast();
    const { data, isLoading } = usePublicData();
    const { isProfileComplete, triggerProfileUpdate } = useAuth();

    const [file, setFile] = useState<File | null>(null);
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const service = useMemo(() => 
        data?.standaloneServices.find(s => s.id === Number(serviceId)), 
    [data, serviceId]);

    const instructor = useMemo(() => 
        instructorId ? data?.instructors.find(i => i.id === Number(instructorId)) : null,
    [data, instructorId]);

    const pricingConfig = data?.pricingSettings;

    if (isLoading) return <PageLoader text="جاري تجهيز الطلب..." />;

    if (!service) {
        return (
            <div className="container mx-auto py-20 text-center">
                <h2 className="text-2xl font-bold text-red-600">الخدمة غير موجودة</h2>
                <Button as={Link} to="/creative-writing/services" variant="outline" className="mt-4">العودة</Button>
            </div>
        );
    }

    // Calculate final price using the calculator logic
    let netPrice = service.price;
    if (instructor && instructor.service_rates && instructor.service_rates[service.id]) {
        netPrice = instructor.service_rates[service.id];
    }
    
    const finalPrice = calculateCustomerPrice(netPrice, pricingConfig);

    const handleConfirm = () => {
         // Enforce Profile Completion
        if (!isProfileComplete) {
            triggerProfileUpdate(true); // Mandatory
            return;
        }

        if (service.requires_file_upload && !file) {
            addToast('يرجى رفع الملف المطلوب للمتابعة.', 'warning');
            return;
        }

        setIsSubmitting(true);
        
        // Simulate a slight delay for better UX
        setTimeout(() => {
            addItemToCart({
                type: 'order',
                payload: {
                    productKey: `service_${service.id}`,
                    summary: instructor ? `خدمة: ${service.name} (مع ${instructor.name})` : `خدمة: ${service.name}`,
                    totalPrice: finalPrice, // Use the calculated customer price
                    // If a file is uploaded, we pass it in the payload. 
                    files: file ? { service_file: file } : undefined,
                    details: {
                        serviceId: service.id,
                        serviceName: service.name,
                        userNotes: notes,
                        fileName: file?.name,
                        assigned_instructor_id: instructor?.id || null,
                    },
                },
            });
            
            addToast(`تمت إضافة "${service.name}" إلى السلة بنجاح!`, 'success');
            navigate('/cart');
            setIsSubmitting(false);
        }, 800);
    };

    return (
        <div className="bg-gray-50 py-12 sm:py-16 animate-fadeIn min-h-screen">
            <div className="container mx-auto px-4 max-w-3xl">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-semibold mb-6 transition-colors">
                    <ArrowLeft size={16} />
                    العودة للخلف
                </button>

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-gray-800">إكمال طلب الخدمة</h1>
                    <p className="text-gray-600 mt-2">يرجى تزويدنا بالمعلومات اللازمة للبدء في العمل على طلبك.</p>
                </div>

                <div className="grid gap-6">
                    {/* Service Summary Card */}
                    <Card>
                        <CardHeader className="bg-blue-50/50 border-b pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <FileText className="text-blue-600" /> ملخص الخدمة
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-xl text-gray-900">{service.name}</h3>
                                    <p className="text-sm text-gray-500 mt-1">{service.description}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-green-600">{finalPrice} ج.م</p>
                                </div>
                            </div>
                            
                            {instructor && (
                                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border">
                                    <Image 
                                        src={instructor.avatar_url || '/images/male-avatar.png'} 
                                        alt={instructor.name} 
                                        className="w-12 h-12 rounded-full object-cover"
                                    />
                                    <div>
                                        <p className="text-xs text-muted-foreground">مع المدرب:</p>
                                        <p className="font-bold text-gray-800">{instructor.name}</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Upload & Notes Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">تفاصيل الطلب</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {service.requires_file_upload && (
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-gray-700">
                                        الملف المطلوب <span className="text-red-500">*</span>
                                    </label>
                                    <ReceiptUpload file={file} setFile={setFile} disabled={isSubmitting} />
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Info size={12} /> يرجى رفع ملف بصيغة Word أو PDF (القصة، النص، إلخ).
                                    </p>
                                </div>
                            )}

                            <FormField label="ملاحظات إضافية (اختياري)" htmlFor="notes">
                                <Textarea 
                                    id="notes" 
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    rows={4}
                                    placeholder="هل هناك أي تعليمات خاصة تود إضافتها للمدرب أو فريق العمل؟"
                                    disabled={isSubmitting}
                                />
                            </FormField>
                        </CardContent>
                        <CardFooter className="bg-gray-50 border-t flex justify-end pt-6">
                            <Button 
                                onClick={handleConfirm} 
                                loading={isSubmitting} 
                                size="lg" 
                                className="w-full sm:w-auto shadow-lg"
                                icon={<CheckCircle />}
                            >
                                إضافة إلى السلة
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ServiceOrderPage;
