"use client";


import React from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, AlertCircle, Clock, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@alrehla/ui/card';
import { Button } from '@alrehla/ui/button';

const PaymentStatusPage: React.FC = () => {
    const searchParams = useSearchParams();
    const status = searchParams.get('status');
    
    const statusConfig = {
        success: {
            icon: <CheckCircle className="h-16 w-16 text-green-500" />,
            title: 'تم استلام طلبك بنجاح!',
            message: 'شكراً لطلبك. فريقنا سيبدأ في تجهيزه فوراً وسيتم إعلامك بالتحديثات.'
        },
        success_review: {
            icon: <Clock className="h-16 w-16 text-primary" />,
            title: 'تم رفع الإيصال بنجاح!',
            message: 'شكراً لك. طلبك الآن قيد المراجعة وسيتم تأكيده خلال 24 ساعة.'
        },
        request_sent: {
            icon: <Send className="h-16 w-16 text-purple-500" />,
            title: 'تم إرسال الطلب لولي الأمر',
            message: 'تم تحويل طلبك بنجاح إلى حساب ولي أمرك للاعتماد والدفع. ستظهر المنتجات في حسابك فور إتمام الدفع.'
        },
        cancelled: {
            icon: <AlertCircle className="h-16 w-16 text-destructive" />,
            title: 'تم إلغاء الطلب',
            message: 'تم إلغاء طلبك. إذا كان هذا خطأ، يرجى التواصل مع الدعم.'
        }
    };

    const currentStatus = statusConfig[status as keyof typeof statusConfig] || statusConfig.cancelled;

    return (
        <div className="flex items-center justify-center min-h-[70vh] bg-muted/50 p-4">
            <Card className="max-w-lg w-full text-center animate-fadeIn">
                <CardHeader>
                    <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-muted mb-4">
                       {currentStatus.icon}
                    </div>
                    <CardTitle className="text-3xl">{currentStatus.title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <CardDescription className="text-base leading-relaxed">{currentStatus.message}</CardDescription>
                    <Button asChild className="mt-8">
                        <Link href="/account">الذهاب إلى حسابي</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};

export default PaymentStatusPage;
