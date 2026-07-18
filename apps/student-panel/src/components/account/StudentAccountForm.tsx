"use client";


import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, ArrowLeft, UserPlus, Lock, Globe } from 'lucide-react';
import { useUserMutations } from '../../hooks/mutations/useUserMutations';
import type { ChildProfile } from '../../lib/database.types';
import { Button } from '@alrehla/ui/button';
import FormField from '@alrehla/ui/form-field';
import { Input } from '@alrehla/ui/input';
import { Card, CardContent } from '@alrehla/ui/card';

interface StudentAccountFormProps {
    childProfile: ChildProfile;
    parentEmail?: string;
    onCancel: () => void;
    onSuccess: () => void;
}

const StudentAccountForm: React.FC<StudentAccountFormProps> = ({ childProfile, parentEmail, onCancel, onSuccess }) => {
    const { createAndLinkStudentAccount } = useUserMutations();
    
    // State for the custom english username part
    const [usernamePart, setUsernamePart] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('123456'); // Default easy password

    // Initial setup: Try to guess english name from arabic name if possible, or leave blank
    useEffect(() => {
        if (childProfile.name) {
             // Try to keep only latin characters
            const initialGuess = childProfile.name.split(' ')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            setUsernamePart(initialGuess);
        }
    }, [childProfile]);

    // Auto-generate email logic whenever usernamePart changes
    useEffect(() => {
        if (parentEmail) {
            // Clean parent email: take part before @
            const parentSlug = parentEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
            
            // Use provided username or fallback to 'child'+ID if empty
            const safeUsername = usernamePart.trim() || `child${childProfile.id}`;
            
            // Format: name.parent@alrehla.student
            const generatedEmail = `${safeUsername}.${parentSlug}@alrehla.student`;
            setEmail(generatedEmail);
        }
    }, [parentEmail, usernamePart, childProfile.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createAndLinkStudentAccount.mutateAsync({
                name: childProfile.name, // We keep the original Arabic name for display
                email, // The email is generated using the English username
                password,
                childProfileId: childProfile.id
            });
            onSuccess();
        } catch (error) {
            console.error("Creation failed", error);
        }
    };

    return (
        <div className="animate-fadeIn">
            <div className="flex items-center gap-4 mb-6 pb-4 border-b">
                <Button variant="ghost" size="icon" onClick={onCancel}>
                    <ArrowLeft size={20} className="text-gray-500" />
                </Button>
                <div>
                    <h2 className="text-xl font-bold text-gray-800">
                        إنشاء حساب طالب لـ: <span className="text-primary">{childProfile.name}</span>
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        تفعيل حساب الدخول الخاص بالطالب لمتابعة الجلسات.
                    </p>
                </div>
            </div>

            <div className="max-w-xl mx-auto">
                <Card className="bg-blue-50 border-blue-200 mb-8">
                    <CardContent className="pt-6 flex items-start gap-3 text-blue-800">
                        <Lock className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-bold mb-1">نظام الحسابات المرتبطة</p>
                            <p>يتم إنشاء حساب الطالب مرتبطاً ببريدك الإلكتروني لسهولة الإدارة. كلمة المرور الافتراضية هي <b>123456</b> ويمكنك تغييرها لاحقاً.</p>
                        </div>
                    </CardContent>
                </Card>

                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    <FormField label="اسم الطالب (بالإنجليزي)" htmlFor="usernamePart">
                        <div className="relative">
                            <Input 
                                type="text" 
                                id="usernamePart" 
                                value={usernamePart} 
                                onChange={(e) => setUsernamePart(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toLowerCase())}
                                placeholder="مثال: ahmed"
                                className="pl-10 text-left dir-ltr"
                                required
                            />
                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            اكتب الاسم بأحرف إنجليزية فقط لتوليد إيميل احترافي (بدون أرقام عشوائية).
                        </p>
                    </FormField>

                    <FormField label="البريد الإلكتروني للدخول (يتم توليده تلقائياً)" htmlFor="email">
                        <Input 
                            type="email" 
                            id="email" 
                            value={email} 
                            readOnly
                            className="bg-gray-100 text-gray-600 cursor-not-allowed font-mono text-left dir-ltr border-dashed"
                        />
                    </FormField>
                    
                    <FormField label="كلمة المرور" htmlFor="password">
                        <Input 
                            type="text" 
                            id="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                            minLength={6}
                            placeholder="******"
                            className="bg-white font-mono"
                        />
                         <p className="text-xs text-muted-foreground mt-1">احتفظ بكلمة المرور هذه لإعطائها للطالب.</p>
                    </FormField>

                    <div className="flex justify-end gap-3 pt-6 mt-6 border-t">
                        <Button type="button" onClick={onCancel} disabled={createAndLinkStudentAccount.isPending} variant="ghost">
                            إلغاء
                        </Button>
                        <Button type="submit" loading={createAndLinkStudentAccount.isPending} icon={<UserPlus size={18} />} className="w-48">
                            {createAndLinkStudentAccount.isPending ? 'جاري الإنشاء...' : 'تفعيل الحساب'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StudentAccountForm;
