"use client";


import React, { useState, useEffect } from 'react';
import { useNavigate } from '@/lib/router-compat';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '@alrehla/ui/button';
import { Input } from '@alrehla/ui/input';
import FormField from '@alrehla/ui/form-field';
import { authService } from '../../../services/authService';
import { Lock, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '../../../contexts/ToastContext';

const ResetPasswordPage: React.FC = () => {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (newPassword.length < 6) {
            addToast('يجب أن تكون كلمة المرور 6 أحرف على الأقل.', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            addToast('كلمتا المرور غير متطابقتين.', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            await authService.updatePassword(newPassword);
            setSuccess(true);
            setTimeout(() => {
                navigate('/account');
            }, 3000);
        } catch (error: any) {
            addToast(error.message, 'error');
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
                    <h2 className="text-2xl font-bold text-gray-800">تعيين كلمة مرور جديدة</h2>
                </div>

                {success ? (
                    <div className="text-center space-y-4 animate-fadeIn">
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 flex flex-col items-center">
                            <CheckCircle size={40} className="mb-2" />
                            <p className="font-bold">تم تغيير كلمة المرور بنجاح!</p>
                            <p className="text-sm">سيتم توجيهك لصفحة الدخول...</p>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                         <div className="p-3 bg-yellow-50 text-yellow-800 text-sm rounded border border-yellow-100 flex gap-2">
                             <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                             <p>أدخل كلمة المرور الجديدة لحسابك. تأكد من أنها قوية وآمنة.</p>
                         </div>

                        <FormField label="كلمة المرور الجديدة" htmlFor="newPassword">
                            <Input 
                                id="newPassword" 
                                type="password" 
                                value={newPassword} 
                                onChange={e => setNewPassword(e.target.value)} 
                                required 
                                minLength={6}
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

                        <Button type="submit" loading={isSubmitting} className="w-full" size="lg">
                            حفظ وتحديث
                        </Button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ResetPasswordPage;
