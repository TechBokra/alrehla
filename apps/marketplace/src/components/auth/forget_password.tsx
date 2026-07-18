'use client';

import React, { useState } from 'react';
import { useClerk } from '@clerk/nextjs';
import { useNavigate } from '@/lib/router-compat';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@alrehla/ui/button';
import { Input } from '@alrehla/ui/input';
import FormField from '@alrehla/ui/form-field';
import { AlertCircle, ArrowRight, CheckCircle, KeyRound, MailOpen } from 'lucide-react';
import { authService } from '../../services/authService';

type Step = 'email' | 'code';

export const ForgetPassword: React.FC = () => {
  const navigate = useNavigate();
  const { isClerkEnabled, sendPasswordResetCode, resetPassword } = useAuth();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      await sendPasswordResetCode(email);
      if (isClerkEnabled) {
        setStep('code');
        setSuccessMessage('تم إرسال رمز التحقق إلى بريدك الإلكتروني.');
      } else {
        setSuccessMessage('تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني.');
      }
    } catch (err: any) {
      setError(err.message || 'فشل إرسال الرابط. تأكد من صحة البريد الإلكتروني.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify code and set new password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      setError('يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await resetPassword(code, newPassword);
      setSuccessMessage('تم تغيير كلمة المرور بنجاح! يتم توجيهك...');
      setTimeout(() => {
        navigate('/account', { replace: true });
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'رمز التحقق غير صحيح أو منتهي الصلاحية.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white p-8 rounded-2xl shadow-lg border animate-fadeIn">
      <button
        onClick={() => navigate('/login')}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
      >
        <ArrowRight size={16} />
        <span>عودة لتسجيل الدخول</span>
      </button>

      <div className="text-center mb-6">
        <div className="mx-auto w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 shadow-sm">
          {step === 'email' ? <KeyRound size={32} /> : <MailOpen size={32} />}
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {step === 'email' ? 'استعادة كلمة المرور' : 'أدخل رمز التحقق'}
        </h2>
        <p className="text-muted-foreground text-sm">
          {step === 'email'
            ? 'أدخل بريدك الإلكتروني المرتبط بحسابك وسنرسل لك تعليمات استعادة كلمة المرور.'
            : 'أدخل الرمز المكون من 6 أرقام المرسل إلى بريدك الإلكتروني.'}
        </p>
      </div>

      {successMessage && step === 'email' && !isClerkEnabled && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-center mb-4">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-2" />
          <p className="text-green-800 font-medium">{successMessage}</p>
        </div>
      )}

      {error && (
        <div className="p-3 mb-4 bg-red-50 text-red-800 border border-red-200 rounded-lg text-sm flex items-start gap-2 font-medium">
          <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {step === 'email' && (!successMessage || isClerkEnabled) && (
        <form onSubmit={handleRequestCode} className="space-y-5">
          <FormField label="البريد الإلكتروني" htmlFor="reset-email">
            <Input
              id="reset-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@example.com"
              className="text-right"
              dir="ltr"
            />
          </FormField>
          <Button type="submit" loading={isLoading} className="w-full text-lg py-6" size="lg">
            إرسال الرمز
          </Button>
        </form>
      )}

      {step === 'code' && (
        <form onSubmit={handleResetPassword} className="space-y-5 animate-fadeIn">
          <FormField label="رمز التحقق" htmlFor="reset-code">
            <Input
              id="reset-code"
              type="text"
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              placeholder="123456"
              className="text-center tracking-widest text-lg font-semibold"
              dir="ltr"
            />
          </FormField>

          <FormField label="كلمة المرور الجديدة" htmlFor="new-password">
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="text-right"
              dir="ltr"
            />
          </FormField>

          <Button type="submit" loading={isLoading} className="w-full text-lg py-6" size="lg">
            تأكيد وتغيير كلمة المرور
          </Button>

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => setStep('email')}
              className="text-sm text-gray-500 hover:text-gray-800 underline transition-colors"
            >
              لم تستلم الرمز؟ حاول مرة أخرى
            </button>
          </div>
        </form>
      )}
      {isClerkEnabled && <div id="clerk-captcha" />}
    </div>
  );
};

export default ForgetPassword;
