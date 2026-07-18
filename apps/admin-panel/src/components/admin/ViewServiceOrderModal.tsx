import React, { useState, useEffect } from 'react';
import { Loader2, Link as LinkIcon } from 'lucide-react';
import { useOrderMutations } from '../../hooks/mutations/useOrderMutations';
import { useAdminInstructors } from '../../hooks/queries/admin/useAdminInstructorsQuery';
import type { ServiceOrderWithRelations, OrderStatus } from '../../lib/database.types';
import { formatDate, getStatusColor } from '../../utils/helpers';
import { Select } from '@alrehla/ui/native-select';
import { Button } from '@alrehla/ui/button';
import Modal from '@alrehla/ui/modal';

const DetailRow: React.FC<{ label: string; value: React.ReactNode; isTextArea?: boolean }> = ({ label, value, isTextArea = false }) => (
    <div className="py-2 border-b">
        <span className="font-semibold text-muted-foreground">{label}:</span>
        {isTextArea ? <div className="text-foreground mt-1 whitespace-pre-wrap bg-muted/50 p-2 rounded">{value || 'N/A'}</div> : <span className="text-foreground mr-2">{value || 'N/A'}</span>}
    </div>
);

interface ViewServiceOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: ServiceOrderWithRelations | null;
}

const ViewServiceOrderModal: React.FC<ViewServiceOrderModalProps> = ({ isOpen, onClose, order }) => {
    const { updateServiceOrderStatus, assignInstructorToServiceOrder } = useOrderMutations();
    const { data: instructors = [], isLoading: instructorsLoading } = useAdminInstructors();
    const [assignedInstructorId, setAssignedInstructorId] = useState<string>('');

    useEffect(() => {
        if (order) {
            setAssignedInstructorId(order.assigned_instructor_id?.toString() || '');
        }
    }, [order]);

    if (!order) return null;

    const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        await updateServiceOrderStatus.mutateAsync({ orderId: order.id, newStatus: e.target.value as OrderStatus });
    };

    const handleInstructorChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newInstructorId = e.target.value ? parseInt(e.target.value) : null;
        setAssignedInstructorId(e.target.value);
        await assignInstructorToServiceOrder.mutateAsync({ orderId: order.id, instructorId: newInstructorId });
    };

    const details = order.details as any || {};
    const statuses: OrderStatus[] = ["بانتظار المراجعة", "قيد التنفيذ", "مكتمل", "ملغي"];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="تفاصيل طلب خدمة"
            size="2xl"
            footer={<Button onClick={onClose}>إغلاق</Button>}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h3 className="font-bold text-lg border-b pb-2">معلومات العميل والطفل</h3>
                    <DetailRow label="العميل" value={order.users?.name} />
                    <DetailRow label="البريد الإلكتروني" value={order.users?.email} />
                    <DetailRow label="الطفل" value={order.child_profiles?.name} />
                </div>

                <div className="space-y-4">
                    <h3 className="font-bold text-lg border-b pb-2">تفاصيل الطلب</h3>
                    <DetailRow label="الخدمة" value={order.standalone_services?.name} />
                    <DetailRow label="التاريخ" value={formatDate(order.created_at)} />
                    <DetailRow label="الإجمالي" value={`${order.total} ج.م`} />
                </div>
            </div>

            <div className="mt-8 space-y-4">
                <h3 className="font-bold text-lg border-b pb-2">بيانات الطلب</h3>
                {details.fileUrl && <DetailRow label="الملف المرفق" value={<a href={details.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1"><LinkIcon size={14}/><span>عرض/تحميل</span></a>} />}
                {details.userNotes && <DetailRow label="ملاحظات العميل" value={details.userNotes} isTextArea />}
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">الحالة</label>
                    <Select value={order.status} onChange={handleStatusChange} className={`p-1 border rounded-md text-sm ${getStatusColor(order.status)}`}>
                        {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </Select>
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">تعيين مدرب</label>
                    {instructorsLoading ? <Loader2 className="animate-spin" /> : (
                        <Select value={assignedInstructorId} onChange={handleInstructorChange}>
                            <option value="">-- غير معين --</option>
                            {instructors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                        </Select>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default ViewServiceOrderModal;