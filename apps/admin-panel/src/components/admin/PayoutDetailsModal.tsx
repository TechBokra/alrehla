import React from 'react';
import Modal from '@alrehla/ui/modal';
import { Button } from '@alrehla/ui/button';
import { formatDate } from '../../utils/helpers';

const PayoutDetailsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    payouts: any[] | undefined;
    instructorName: string;
}> = ({ isOpen, onClose, payouts, instructorName }) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`سجل الدفعات لـ ${instructorName}`}
        >
            <div className="max-h-96 overflow-y-auto">
                {payouts && payouts.length > 0 ? (
                    <ul className="space-y-3">
                        {payouts.map(payout => (
                            <li key={payout.id} className="p-3 bg-muted rounded-lg">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-lg">{payout.amount} ج.م</span>
                                    <span className="text-xs text-muted-foreground">{formatDate(payout.payout_date)}</span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">{payout.details}</p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-muted-foreground py-8">لا توجد دفعات مسجلة لهذا المدرب.</p>
                )}
            </div>
        </Modal>
    );
};

export default PayoutDetailsModal;
