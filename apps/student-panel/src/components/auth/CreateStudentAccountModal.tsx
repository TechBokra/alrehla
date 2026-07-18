"use client";

import React, { useState, useEffect } from 'react';
import { Save, AlertCircle } from 'lucide-react';
import { useUserMutations } from '../../hooks/mutations/useUserMutations';
import type { ChildProfile } from '../../lib/database.types';
import { Button } from '@alrehla/ui/button';
import FormField from '@alrehla/ui/form-field';
import { Input } from '@alrehla/ui/input';
import Modal from '@alrehla/ui/modal';

interface CreateStudentAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    childProfile: ChildProfile | null;
}

const CreateStudentAccountModal: React.FC<CreateStudentAccountModalProps> = ({ isOpen, onClose, childProfile }) => {
    const { createAndLinkStudentAccount } = useUserMutations();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setEmail('');
            setPassword('');
        }
    }, [isOpen]);

    if (!childProfile) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createAndLinkStudentAccount.mutateAsync({
                name: childProfile.name,
                email,
                password,
                childProfileId: childProfile.id
            });
            onClose();
        } catch (error) {
            // Error is handled in the mutation hook
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`إنشاء حساب للطالب: ${childProfile.name}`}
            footer={
                <>
                    <Button type="button" onClick={onClose} disabled={createAndLinkStudentAccount.isPending} variant="ghost">إلغاء</Button>
                    <Button type="submit" form="create-student-form" loading={createAndLinkStudentAccount.isPending} icon={<Save />}>
                        {createAndLinkStudentAccount.isPending ? 'جاري الإنشاء...' : 'إنشاء وربط الحساب'}
                    </Button>
                </>
            }
        >
            <form id="create-student-form" onSubmit={handleSubmit} className="space-y-6">
                <FormField label="البريد الإلكتروني للطالب*" htmlFor="email">
                    <Input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </FormField>
                <FormField label="كلمة المرور*" htmlFor="password">
                    <Input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </FormField>
                
                <div className="mt-2 flex items-start gap-2 text-xs text-yellow-700 bg-yellow-50 p-2 rounded-md">
                    <AlertCircle size={20} className="flex-shrink-0" />
                    <span>سيتمكن الطالب من استخدام هذا الحساب للدخول إلى لوحة التحكم الخاصة به ومتابعة الجلسات.</span>
                </div>
            </form>
        </Modal>
    );
};

export default CreateStudentAccountModal;