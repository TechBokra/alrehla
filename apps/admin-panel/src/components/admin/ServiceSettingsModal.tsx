
import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import type { StandaloneService } from '../../lib/database.types';
import { Button } from '@alrehla/ui/button';
import { Input } from '@alrehla/ui/input';
import { Textarea } from '@alrehla/ui/textarea';
import FormField from '@alrehla/ui/form-field';
import Modal from '@alrehla/ui/modal';
import { Select } from '@alrehla/ui/native-select';
import { IconMap } from '../creative-writing/services/IconMap';

interface ServiceSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (payload: Partial<StandaloneService>) => void;
    isSaving: boolean;
    serviceToEdit: StandaloneService | null;
}

export const ServiceSettingsModal: React.FC<ServiceSettingsModalProps> = ({ isOpen, onClose, onSave, isSaving, serviceToEdit }) => {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<'استشارات' | 'مراجعات' | 'نشر' | 'قصص فيديو' | 'قصص مسموعة'>('استشارات');
    const [iconName, setIconName] = useState('MessageSquare');
    const [requiresFileUpload, setRequiresFileUpload] = useState(false);
    const [providerType, setProviderType] = useState<'company' | 'instructor'>('instructor');

    useEffect(() => {
        if (isOpen) {
            if (serviceToEdit) {
                setName(serviceToEdit.name);
                setPrice(serviceToEdit.price.toString());
                setDescription(serviceToEdit.description);
                setCategory(serviceToEdit.category as any);
                setIconName(serviceToEdit.icon_name);
                setRequiresFileUpload(serviceToEdit.requires_file_upload);
                setProviderType(serviceToEdit.provider_type || 'instructor');
            } else {
                setName('');
                setPrice('');
                setDescription('');
                setCategory('استشارات');
                setIconName('MessageSquare');
                setRequiresFileUpload(false);
                setProviderType('instructor');
            }
        }
    }, [isOpen, serviceToEdit]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload: Partial<StandaloneService> = {
            id: serviceToEdit?.id,
            name,
            price: parseFloat(price) || 0,
            description,
            category,
            icon_name: iconName,
            requires_file_upload: requiresFileUpload,
            provider_type: providerType,
        };
        onSave(payload);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={serviceToEdit ? 'تعديل الخدمة' : 'إضافة خدمة جديدة'}
            footer={
                <>
                    <Button type="button" onClick={onClose} disabled={isSaving} variant="ghost">إلغاء</Button>
                    <Button type="submit" form="service-form" loading={isSaving} icon={<Save />}>
                        {isSaving ? 'جاري الحفظ...' : 'حفظ'}
                    </Button>
                </>
            }
        >
                <form id="service-form" onSubmit={handleSubmit} className="space-y-6">
                    <FormField label="اسم الخدمة*" htmlFor="name">
                        <Input id="name" type="text" value={name} onChange={e => setName(e.target.value)} required />
                    </FormField>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField label="السعر (ج.م)*" htmlFor="price">
                            <Input id="price" type="number" value={price} onChange={e => setPrice(e.target.value)} required />
                        </FormField>
                        <FormField label="مقدم الخدمة" htmlFor="provider_type">
                            <Select id="provider_type" value={providerType} onChange={e => setProviderType(e.target.value as any)}>
                                <option value="instructor">المدرب</option>
                                <option value="company">الشركة</option>
                            </Select>
                        </FormField>
                    </div>
                    <FormField label="الوصف*" htmlFor="description">
                        <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={3} required />
                    </FormField>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField label="الفئة" htmlFor="category">
                            <Select id="category" value={category} onChange={e => setCategory(e.target.value as any)}>
                                <option value="استشارات">استشارات</option>
                                <option value="مراجعات">مراجعات</option>
                                <option value="نشر">نشر</option>
                                <option value="قصص فيديو">قصص فيديو</option>
                                <option value="قصص مسموعة">قصص مسموعة</option>
                            </Select>
                        </FormField>
                        <FormField label="الأيقونة" htmlFor="icon_name">
                             <Select id="icon_name" value={iconName} onChange={e => setIconName(e.target.value)}>
                                {Object.keys(IconMap).map(icon => (
                                    <option key={icon} value={icon}>{icon}</option>
                                ))}
                            </Select>
                        </FormField>
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" checked={requiresFileUpload} onChange={e => setRequiresFileUpload(e.target.checked)} id="requiresFileUpload-checkbox" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                        <label htmlFor="requiresFileUpload-checkbox" className="text-sm font-medium text-gray-700">تتطلب رفع ملف من المستخدم</label>
                    </div>
                </form>
        </Modal>
    );
};
