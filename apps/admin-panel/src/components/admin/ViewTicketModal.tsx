import React from 'react';
import type { SupportTicket } from '../../lib/database.types';
import Modal from '@alrehla/ui/modal';
import { Button } from '@alrehla/ui/button';

const ViewTicketModal: React.FC<{
    ticket: SupportTicket | null;
    isOpen: boolean;
    onClose: () => void;
}> = ({ ticket, isOpen, onClose }) => {
    if (!ticket) return null;
    
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="تفاصيل الرسالة"
            footer={
                <Button onClick={onClose}>
                    إغلاق
                </Button>
            }
        >
             <div className="space-y-4 text-sm">
                <p><span className="font-semibold text-muted-foreground">من:</span> <span className="text-foreground">{ticket.name} ({ticket.email})</span></p>
                <p><span className="font-semibold text-muted-foreground">الموضوع:</span> <span className="text-foreground">{ticket.subject}</span></p>
                <div className="p-3 bg-muted rounded-lg border max-h-60 overflow-y-auto">
                    <p className="whitespace-pre-wrap text-foreground">{ticket.message}</p>
                </div>
             </div>
        </Modal>
    );
};

export default ViewTicketModal;