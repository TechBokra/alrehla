"use client";

import React, { useState, useEffect } from 'react';
import Modal from '@alrehla/ui/modal';
import { Button } from '@alrehla/ui/button';
import { Textarea } from '@alrehla/ui/textarea';
import FormField from '@alrehla/ui/form-field';
import ReceiptUpload from '../../shared/ReceiptUpload'; // Reusing this component for general file upload
import type { StandaloneService } from '../../../lib/database.types';
import { useToast } from '../../../contexts/ToastContext';

interface ServiceOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    service: StandaloneService | null;
    onConfirm: (service: StandaloneService, file: File, notes: string) => void;
}

export const ServiceOrderModal: React.FC<ServiceOrderModalProps> = ({ isOpen, onClose, service, onConfirm }) => {
    const [file, setFile] = useState<File | null>(null);
    const [notes, setNotes] = useState('');
    const { addToast } = useToast();

    useEffect(() => {
        if (!isOpen) {
            setFile(null);
            setNotes('');
        }
    }, [isOpen]);

    if (!service) return null;

    const handleSubmit = () => {
        if (!file) {
            addToast('يرجى رفع الملف المطلوب للمتابعة.', 'warning');
            return;
        }
        onConfirm(service, file, notes);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`طلب خدمة: ${service.name}`}
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>إلغاء</Button>
                    <Button onClick={handleSubmit}>تأكيد وإضافة للسلة</Button>
                </>
            }
        >
            <div className="space-y-4">
                <p className="text-sm text-gray-600">
                    لإتمام طلب هذه الخدمة، يرجى رفع الملف المطلوب وإضافة أي ملاحظات قد تساعد المدرب.
                </p>
                <FormField label="رفع الملف المطلوب*" htmlFor="service-file">
                    <ReceiptUpload file={file} setFile={setFile} />
                </FormField>
                <FormField label="ملاحظات إضافية (اختياري)" htmlFor="notes">
                    <Textarea 
                        id="notes" 
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        rows={3}
                        placeholder="هل هناك أي تفاصيل تود إضافتها؟"
                    />
                </FormField>
            </div>
        </Modal>
    );
};
