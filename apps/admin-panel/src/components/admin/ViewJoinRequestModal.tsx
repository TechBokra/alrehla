import React from 'react';
import { Link as LinkIcon } from 'lucide-react';
import type { JoinRequest } from '../../lib/database.types';
import Modal from '@alrehla/ui/modal';
import { Button } from '@alrehla/ui/button';

const ViewJoinRequestModal: React.FC<{
    request: JoinRequest | null;
    isOpen: boolean;
    onClose: () => void;
}> = ({ request, isOpen, onClose }) => {
    if (!request) return null;
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="تفاصيل طلب الانضمام"
            footer={<Button onClick={onClose}>إغلاق</Button>}
        >
            <div className="space-y-4 text-sm">
                <p><span className="font-semibold text-muted-foreground">الاسم:</span> <span className="text-foreground">{request.name}</span></p>
                <p><span className="font-semibold text-muted-foreground">البريد الإلكتروني:</span> <span className="text-foreground">{request.email}</span></p>
                <p><span className="font-semibold text-muted-foreground">رقم الهاتف:</span> <span className="text-foreground">{request.phone}</span></p>
                <p><span className="font-semibold text-muted-foreground">مهتم بالانضمام كـ:</span> <span className="text-foreground">{request.role}</span></p>
                {request.portfolio_url && (
                    <p className="flex items-center gap-2">
                        <span className="font-semibold text-muted-foreground">معرض الأعمال:</span> 
                        <a href={request.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                            <LinkIcon size={14}/> <span>رابط</span>
                        </a>
                    </p>
                )}
                <div className="p-3 bg-muted rounded-lg border max-h-60 overflow-y-auto">
                    <p className="whitespace-pre-wrap text-foreground">{request.message}</p>
                </div>
            </div>
        </Modal>
    );
};

export default ViewJoinRequestModal;