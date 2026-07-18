"use client";


import React, { useState, useEffect } from 'react';
import { Save, Lock, AlertTriangle, CheckCircle } from 'lucide-react';
import { useUserMutations } from '../../hooks/mutations/useUserMutations';
import type { EnrichedChildProfile } from '../../hooks/queries/user/useUserDataQuery';
import { Button } from '@alrehla/ui/button';
import FormField from '@alrehla/ui/form-field';
import { Input } from '@alrehla/ui/input';
import Modal from '@alrehla/ui/modal';
import { useToast } from '../../contexts/ToastContext';

interface StudentPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    child: EnrichedChildProfile | null;
}

const StudentPasswordModal: React.FC<StudentPasswordModalProps> = ({ isOpen, onClose, child }) => {
    const { resetStudentPassword } = useUserMutations();
    const { addToast } = useToast();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setNewPassword('');
            setConfirmPassword('');
            setIsSuccess(false);
            setLocalError(null);
        }
    }, [isOpen]);

    if (!child) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);
        
        if (newPassword.length < 6) {
             setLocalError('كلمة المرور يجب أن تكون 6 أحرف على الأقل.');
             return;
        }

        if (newPassword !== confirmPassword) {
            setLocalError('كلمتا المرور غير متطابقتين.');
            return;
        }

        if (!child.student_user_id) {
            setLocalError('لا يوجد حساب طالب مرتبط بهذا الملف لتغيير كلمة مروره.');
            return;
        }

        try {
            await resetStudentPassword.mutateAsync({
                studentUserId: child.student_user_id,
                newPassword
            });
            setIsSuccess(true);
            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (error: any) {
            // Display exact error message
            setLocalError(error.message || 'حدث خطأ أثناء تغيير كلمة المرور.');
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`تغيير كلمة مرور الطالب: ${child.name}`}
            footer={
                !isSuccess ? (
                    <>
                        <Button type="button" onClick={onClose} disabled={resetStudentPassword.isPending} variant="ghost">إلغاء</Button>
                        <Button type="submit" form="reset-student-password-form" loading={resetStudentPassword.isPending} icon={<Save />}>
                            حفظ التغيير
                        </Button>
                    </>
                ) : null
            }
        >
            {isSuccess ? (
                <div className="flex flex-col items-center justify-center py-8 text-center animate-fadeIn">
                    <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                    <h3 className="text-xl font-bold text-green-700">تم تغيير كلمة المرور بنجاح</h3>
                    <p className="text-gray-500 mt-2">يمكن للطالب الآن الدخول بكلمة المرور الجديدة.</p>
                </div>
            ) : (
                <form id="reset-student-password-form" onSubmit={handleSubmit} className="space-y-6">
                    {localError && (
                        <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-center gap-2 text-sm border border-red-200 animate-fadeIn">
                            <AlertTriangle size={16} />
                            <span>{localError}</span>
                        </div>
                    )}
                    
                    {!child.student_user_id ? (
                        <div className="bg-orange-50 text-orange-700 p-4 rounded-lg flex items-center gap-3 text-sm border border-orange-200">
                            <AlertTriangle size={24} />
                            <div>
                                <p className="font-bold">خطأ في الحساب</p>
                                <p>هذا الملف غير مرتبط بحساب طالب فعلي في قاعدة البيانات. يرجى إنشاء حساب جديد له أولاً.</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <FormField label="كلمة المرور الجديدة" htmlFor="newPassword">
                                <Input 
                                    type="password" 
                                    id="newPassword" 
                                    value={newPassword} 
                                    onChange={(e) => setNewPassword(e.target.value)} 
                                    required 
                                    minLength={6}
                                    placeholder="******"
                                    disabled={resetStudentPassword.isPending}
                                />
                            </FormField>
                            <FormField label="تأكيد كلمة المرور" htmlFor="confirmPassword">
                                <Input 
                                    type="password" 
                                    id="confirmPassword" 
                                    value={confirmPassword} 
                                    onChange={(e) => setConfirmPassword(e.target.value)} 
                                    required 
                                    disabled={resetStudentPassword.isPending}
                                />
                            </FormField>
                            <div className="flex items-center gap-2 text-xs text-yellow-700 bg-yellow-50 p-2 rounded">
                                <Lock size={14}/>
                                <span>سيتمكن الطالب من الدخول بكلمة المرور الجديدة فوراً.</span>
                            </div>
                        </>
                    )}
                </form>
            )}
        </Modal>
    );
};

export default StudentPasswordModal;
