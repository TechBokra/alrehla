"use client";


import React, { useState } from 'react';
import { ArrowLeft, AlertTriangle, Shield } from 'lucide-react';
import { AuthForm } from '../../../components/auth/AuthForm';
import { Button } from '@alrehla/ui/button';
import { Input } from '@alrehla/ui/input';
import FormField from '@alrehla/ui/form-field';

const AgeGate: React.FC<{ onAgeSubmit: (age: number) => void }> = ({ onAgeSubmit }) => {
    const [age, setAge] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const ageNum = parseInt(age, 10);
        if (!isNaN(ageNum) && ageNum > 0) {
            onAgeSubmit(ageNum);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto bg-white p-8 rounded-2xl shadow-lg text-center animate-fadeIn">
            <h1 className="text-2xl font-bold text-gray-800">أهلاً بك في رحلتنا!</h1>
            <p className="text-gray-600 mt-2 mb-8">
                لتقديم أفضل تجربة، يرجى إخبارنا بعمرك.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <FormField label="ما هو عمرك؟" htmlFor="age">
                    <Input
                        type="number"
                        id="age"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        className="text-center text-xl font-bold"
                        required
                        min="1"
                    />
                </FormField>
                <Button type="submit" className="w-full">
                    متابعة
                </Button>
            </form>
        </div>
    );
};

const UnderageNotice: React.FC<{ onParentRegister: () => void, onGoBack: () => void }> = ({ onParentRegister, onGoBack }) => {
    return (
        <div className="w-full max-w-md mx-auto bg-white p-8 rounded-2xl shadow-lg text-center animate-fadeIn">
            <AlertTriangle className="mx-auto h-16 w-16 text-yellow-400 mb-4" />
            <h1 className="text-2xl font-bold text-gray-800">تنبيه بخصوص العمر</h1>
            <p className="text-gray-600 mt-2 mb-8">
                عذراً، يجب أن يكون عمرك 12 عاماً أو أكثر لإنشاء حساب مستقل. يرجى الطلب من ولي أمرك إنشاء الحساب.
            </p>
            <div className="space-y-4">
                 <Button 
                    onClick={onParentRegister}
                    className="w-full"
                    icon={<Shield size={18} />}>
                    أنا ولي الأمر، سأقوم بإنشاء الحساب
                </Button>
                <Button 
                    onClick={onGoBack}
                    variant="subtle"
                    className="w-full">
                    العودة
                </Button>
            </div>
        </div>
    );
};


const RegisterPage: React.FC = () => {
    type Step = 'age' | 'underage' | 'form';
    const [step, setStep] = useState<Step>('age');

    const handleAgeSubmit = (submittedAge: number) => {
        if (submittedAge < 12) {
            setStep('underage');
        } else {
            setStep('form');
        }
    };

    const handleParentRegister = () => {
        setStep('form');
    };
    
    const goBackToAgeStep = () => {
      setStep('age');
    }

    return (
        <div className="container mx-auto px-4 py-12">
            {step === 'age' && <AgeGate onAgeSubmit={handleAgeSubmit} />}
            
            {step === 'underage' && <UnderageNotice onParentRegister={handleParentRegister} onGoBack={goBackToAgeStep} />}

            {step === 'form' && (
                 <div className="max-w-md mx-auto animate-fadeIn">
                     <button onClick={goBackToAgeStep} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4">
                        <ArrowLeft size={16} />
                        <span>العودة</span>
                    </button>
                    <AuthForm mode="signup" />
                </div>
            )}
        </div>
    );
};

export default RegisterPage;
