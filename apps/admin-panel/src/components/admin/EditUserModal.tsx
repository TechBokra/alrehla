
import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, Lock, Info } from 'lucide-react';
import type { UserProfile as User, UserRole } from '../../contexts/AuthContext.tsx';
import { Button } from '@alrehla/ui/button';
import { Input } from '@alrehla/ui/input';
import FormField from '@alrehla/ui/form-field';
import Modal from '@alrehla/ui/modal';
import { useAuth } from '../../contexts/AuthContext';
import { roleNames } from '../../lib/roles';
import { Select } from '@alrehla/ui/native-select';

interface EditUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (payload: any) => void;
    user: User | null;
    isSaving: boolean;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, onClose, onSave, user, isSaving }) => {
    const { currentUser } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<UserRole>('user');

    const isEditMode = !!user;
    const canChangeRole = currentUser?.role === 'super_admin';
    const isEditingSelf = user?.id === currentUser?.id;

    useEffect(() => {
        if (user) {
            setName(user.name);
            setEmail(user.email);
            setRole(user.role);
            setPassword('');
        } else {
            setName('');
            setEmail('');
            setPassword('');
            setRole('user');
        }
    }, [user, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = isEditMode
            ? { id: user.id, name, role, password: password || undefined }
            : { name, email, password, role };
        
        onSave(payload);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditMode ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}
            footer={
                 <>
                    <Button type="button" onClick={onClose} disabled={isSaving} variant="ghost">إلغاء</Button>
                    <Button type="submit" form="edit-user-form" loading={isSaving}>
                        {isSaving ? 'جاري الحفظ...' : 'حفظ'}
                    </Button>
                </>
            }
        >
            <form id="edit-user-form" onSubmit={handleSubmit} className="space-y-6">
                <FormField label="الاسم*" htmlFor="name">
                    <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                </FormField>
                <FormField label="البريد الإلكتروني*" htmlFor="email">
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isEditMode} />
                </FormField>
                {canChangeRole && (
                    <FormField label="الدور" htmlFor="role">
                        <Select id="role" value={role} onChange={e => setRole(e.target.value as UserRole)} disabled={user?.id === currentUser?.id}>
                             {Object.entries(roleNames).map(([key, name]) => (
                                <option key={key} value={key}>{name}</option>
                            ))}
                        </Select>
                         {user?.id === currentUser?.id && <p className="text-xs text-muted-foreground mt-1">لا يمكنك تغيير دور حسابك.</p>}
                    </FormField>
                )}
                
                {/* Password Logic:
                    1. Create New User: Password Required.
                    2. Edit Self: Password Optional (Change).
                    3. Edit Other: Password Disabled (Cannot change securely client-side).
                */}
                
                {!isEditMode && (
                    <FormField label="كلمة المرور*" htmlFor="password">
                        <Input 
                            id="password" 
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                            placeholder="كلمة المرور للحساب الجديد"
                        />
                        <div className="mt-2 flex items-start gap-2 text-xs text-blue-700 bg-blue-50 p-2 rounded-md">
                            <Info size={16} className="flex-shrink-0" />
                            <span>سيتم إنشاء هذا الحساب في قاعدة البيانات مباشرة ويمكن للمستخدم الدخول به فوراً.</span>
                        </div>
                    </FormField>
                )}

                {isEditMode && isEditingSelf && (
                    <FormField label="تغيير كلمة المرور (اختياري)" htmlFor="password">
                        <Input 
                            id="password" 
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            placeholder="اتركه فارغاً للإبقاء على الكلمة الحالية"
                        />
                    </FormField>
                )}

                {isEditMode && !isEditingSelf && (
                     <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                        <h4 className="text-sm font-bold text-yellow-800 flex items-center gap-2 mb-2">
                            <Lock size={16} />
                            تغيير كلمة المرور
                        </h4>
                        <p className="text-xs text-yellow-700">
                            لأسباب أمنية، لا يمكن تغيير كلمات مرور المستخدمين الآخرين مباشرة. يرجى توجيه المستخدم لاستخدام خيار "نسيت كلمة المرور" في صفحة الدخول.
                        </p>
                    </div>
                )}
                
            </form>
        </Modal>
    );
};

export default EditUserModal;
