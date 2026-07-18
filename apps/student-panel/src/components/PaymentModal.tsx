"use client";


import React, { useState, useEffect } from 'react';
import { Loader2, Upload, Link as LinkIcon, AlertCircle, Copy, Check } from 'lucide-react';
import { useOrderMutations } from '../hooks/mutations/useOrderMutations';
import { useToast } from '../contexts/ToastContext';
import Modal from '@alrehla/ui/modal';
import ReceiptUpload from './shared/ReceiptUpload';
import { Button } from '@alrehla/ui/button';
import { usePublicData } from '../hooks/queries/public/usePublicDataQuery';
import Image from '@alrehla/ui/next-image';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item: { id: string; type: 'order' | 'booking' | 'subscription' } | null;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onSuccess, item }) => {
  const { updateReceipt } = useOrderMutations();
  const { addToast } = useToast();
  const { data: publicData } = usePublicData();
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);
  
  const isSubmitting = updateReceipt.isPending;
  const instapayUrl = publicData?.communicationSettings?.instapay_url || '#';
  const instapayQrUrl = publicData?.communicationSettings?.instapay_qr_url;
  const instapayNumber = publicData?.communicationSettings?.instapay_number;

  useEffect(() => {
    if (isOpen) {
        setReceiptFile(null);
        setCopied(false);
    }
  }, [isOpen]);

  if (!item) return null;

  const handleConfirmPayment = async () => {
    if (!receiptFile) {
        addToast('يرجى رفع إيصال الدفع أولاً.', 'warning');
        return;
    }
    
    try {
        await updateReceipt.mutateAsync({
            itemId: item.id,
            itemType: item.type,
            receiptFile
        });
        onSuccess();
    } catch (error: any) {
        // Error toast handled in hook
    }
  };

  const handleCopyNumber = () => {
      if (instapayNumber) {
          navigator.clipboard.writeText(instapayNumber);
          setCopied(true);
          addToast('تم نسخ الرقم بنجاح', 'success');
          setTimeout(() => setCopied(false), 2000);
      }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="تأكيد الدفع"
      footer={
        <>
          <Button onClick={onClose} disabled={isSubmitting} variant="ghost">
            إلغاء
          </Button>
          <Button
            onClick={handleConfirmPayment}
            disabled={!receiptFile || isSubmitting}
            loading={isSubmitting}
            icon={isSubmitting ? undefined : <Upload size={18} />}
            variant="success"
            className="w-48"
          >
            {isSubmitting ? 'جاري الرفع...' : 'تأكيد ورفع الإيصال'}
          </Button>
        </>
      }
    >
      <p className="text-gray-600 mb-6 text-center">
        لإتمام طلبك رقم <span className="font-bold font-mono text-sm">{item.id}</span>، يرجى اتباع الخطوات التالية.
      </p>

      <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg space-y-6">
        <div>
            <p className="font-semibold text-gray-700 mb-3">1. قم بالدفع عبر Instapay:</p>
            
            {instapayQrUrl && (
                <div className="mb-4 flex justify-center">
                    <div className="w-64 h-64 bg-white p-2 rounded-lg shadow-sm">
                        <Image src={instapayQrUrl} alt="Instapay QR Code" className="w-full h-full object-contain" />
                    </div>
                </div>
            )}

            <div className="space-y-3">
                 {instapayNumber && (
                    <div className="flex items-center justify-between bg-white p-3 rounded-md border">
                        <span className="text-sm text-gray-500">رقم التحويل:</span>
                        <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-lg dir-ltr">{instapayNumber}</span>
                            <Button size="sm" variant="ghost" onClick={handleCopyNumber} className="h-8 w-8 p-0">
                                {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                            </Button>
                        </div>
                    </div>
                )}

                <a href={instapayUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-full hover:bg-blue-700 transition-colors">
                    <LinkIcon size={18} />
                    <span>فتح التطبيق / رابط الدفع</span>
                </a>
            </div>
            
             <div className="flex items-center gap-2 text-sm text-blue-700 mt-3">
                <AlertCircle size={16} />
                <span>يرجى التأكد من المبلغ قبل التحويل.</span>
            </div>
        </div>

        <div className="border-t border-blue-200 pt-4">
            <p className="font-semibold text-gray-700 mb-3">2. ارفع صورة إيصال الدفع هنا:</p>
            <ReceiptUpload file={receiptFile} setFile={setReceiptFile} disabled={isSubmitting} />
        </div>
      </div>
    </Modal>
  );
};

export default PaymentModal;
