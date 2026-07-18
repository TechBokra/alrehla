import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import type { CreativeWritingPackage } from '../../lib/database.types';
import { Button } from '@alrehla/ui/button';
import { Input } from '@alrehla/ui/input';
import { Textarea } from '@alrehla/ui/textarea';
import FormField from '@alrehla/ui/form-field';
import Modal from '@alrehla/ui/modal';
import { Checkbox } from '@alrehla/ui/checkbox';

interface CWSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (payload: any) => void;
    isSaving: boolean;
    packageToEdit: CreativeWritingPackage | null;
}

export const CWSettingsModal: React.FC<CWSettingsModalProps> = ({ isOpen, onClose, onSave, isSaving, packageToEdit }) => {
    const [name, setName] = useState('');
    const [sessions, setSessions] = useState('');
    const [price, setPrice] = useState('');
    const [features, setFeatures] = useState('');
    const [description, setDescription] = useState('');
    const [popular, setPopular] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (packageToEdit) {
                setName(packageToEdit.name);
                setSessions(packageToEdit.sessions);
                setPrice(packageToEdit.price.toString());
                setFeatures(packageToEdit.features.join('\n'));
                setDescription(packageToEdit.description);
                setPopular(packageToEdit.popular);
            } else {
                setName('');
                setSessions('');
                setPrice('');
                setFeatures('');
                setDescription('');
                setPopular(false);
            }
        }
    }, [isOpen, packageToEdit]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            id: packageToEdit?.id,
            name,
            sessions,
            price: parseFloat(price) || 0,
            features: features.split('\n').filter(f => f.trim() !== ''),
            description,
            popular,
        };
        onSave(payload);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={packageToEdit ? 'تعديل الباقة' : 'إضافة باقة جديدة'}
            footer={
                <>
                    <Button type="button" onClick={onClose} disabled={isSaving} variant="ghost">إلغاء</Button>
                    <Button type="submit" form="package-form" loading={isSaving} icon={<Save />}>
                        {isSaving ? 'جاري الحفظ...' : 'حفظ'}
                    </Button>
                </>
            }
        >
            <form id="package-form" onSubmit={handleSubmit} className="space-y-6">
                <FormField label="اسم الباقة*" htmlFor="name">
                    <Input id="name" type="text" value={name} onChange={e => setName(e.target.value)} required />
                </FormField>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField label="الجلسات*" htmlFor="sessions">
                        <Input id="sessions" type="text" value={sessions} onChange={e => setSessions(e.target.value)} required placeholder="مثال: 4 جلسات"/>
                    </FormField>
                    <FormField label="السعر (ج.م)*" htmlFor="price">
                        <Input id="price" type="number" value={price} onChange={e => setPrice(e.target.value)} required />
                    </FormField>
                </div>
                <FormField label="الوصف*" htmlFor="description">
                    <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={3} required />
                </FormField>
                <FormField label="الميزات (كل ميزة في سطر)" htmlFor="features">
                    <Textarea id="features" value={features} onChange={e => setFeatures(e.target.value)} rows={4} />
                </FormField>
                <div className="flex items-center gap-2">
                    <Checkbox
                        id="popular-checkbox"
                        checked={popular}
                        onCheckedChange={checked => setPopular(!!checked)}
                    />
                    <label htmlFor="popular-checkbox" className="text-sm font-medium text-gray-700">علامة "الأكثر شيوعاً"</label>
                </div>
            </form>
        </Modal>
    );
};
