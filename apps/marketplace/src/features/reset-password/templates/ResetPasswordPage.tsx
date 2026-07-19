"use client";

import React, { useState } from 'react';
import { useNavigate } from '@/lib/router-compat';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '@alrehla/ui/button';
import { Input } from '@alrehla/ui/input';
import FormField from '@alrehla/ui/form-field';
import { Lock, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '../../../contexts/ToastContext';

const ResetPasswordPage: React.FC = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const { sendPasswordResetCode, resetPassword, loading } = useAuth();
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isCodeSent, setIsCodeSent] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        const normalizedEmail = email.trim().toLowerCase();

        if (!normalizedEmail) {
            addToast('أدخل البريد الإلكتروني أولاً.', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            await sendPasswordResetCode(normalizedEmail);
            setIsCodeSent(true);
        } catch (error: any) {
            addToast(error.message || 'تعذر إرسال رمز الاستعادة.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!code.trim()) {
            addToast('أدخل رمز التحقق المرسل إلى بريدك.', 'error');
            return;
        }

        if (newPassword.length < 8) {
            addToast('يجب أن تكون كلمة المرور 8 أحرف على الأقل.', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            addToast('كلمتا المرور غير متطابقتين.', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            await resetPassword(code, newPassword);
            setSuccess(true);
            setTimeout(() => {
                navigate('/account');
            }, 2000);
        } catch (error: any) {
            addToast(error.message || 'تعذر تغيير كلمة المرور.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg border">
                <div className="text-center mb-6">
                    <div className="mx-auto w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                        <Lock size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">استعادة كلمة المرور</h2>
                </div>

                {success ? (
                    <div className="text-center space-y-4 animate-fadeIn">
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 flex flex-col items-center">
                            <CheckCircle size={40} className="mb-2" />
                            <p className="font-bold">تم تغيير كلمة المرور بنجاح!</p>
                            <p className="text-sm">سيتم توجيهك الآن...</p>
                        </div>
                    </div>
                ) : !isCodeSent ? (
                    <form onSubmit={handleSendCode} className="space-y-4">
                        <div className="p-3 bg-blue-50 text-blue-800 text-sm rounded border border-blue-100 flex gap-2">
                            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                            <p>أدخل بريدك الإلكتروني وسنرسل رمز استعادة من Clerk.</p>
                        </div>

                        <FormField label="البريد الإلكتروني" htmlFor="email">
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                            />
                        </FormField>

                        <Button type="submit" loading={isSubmitting || loading} className="w-full" size="lg">
                            إرسال رمز الاستعادة
                        </Button>
                    </form>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="p-3 bg-yellow-50 text-yellow-800 text-sm rounded border border-yellow-100 flex gap-2">
                            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                            <p>أدخل رمز التحقق وكلمة المرور الجديدة. تتم العملية بالكامل عبر Clerk.</p>
                        </div>

                        <FormField label="رمز التحقق" htmlFor="code">
                            <Input
                                id="code"
                                inputMode="numeric"
                                value={code}
                                onChange={e => setCode(e.target.value)}
                                required
                            />
                        </FormField>
                        <FormField label="كلمة المرور الجديدة" htmlFor="newPassword">
                            <Input
                                id="newPassword"
                                type="password"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                required
                                minLength={8}
                            />
                        </FormField>
                        <FormField label="تأكيد كلمة المرور" htmlFor="confirmPassword">
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                required
                            />
                        </FormField>

                        <Button type="submit" loading={isSubmitting || loading} className="w-full" size="lg">
                            حفظ كلمة المرور
                        </Button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ResetPasswordPage;
