
import React, { useState, useEffect } from 'react';
import { Save, Link as LinkIcon } from 'lucide-react';
import { useOrderMutations } from '../../hooks/mutations/useOrderMutations';
import { useAdminPersonalizedProducts } from '../../hooks/queries/admin/useAdminEnhaLakQuery';
import type { Order, OrderStatus } from '../../lib/database.types';
import { formatDate, getStatusColor, calculateAge } from '../../utils/helpers';
import Modal from '@alrehla/ui/modal';
import { Button } from '@alrehla/ui/button';
import { Select } from '@alrehla/ui/native-select';
import { Textarea } from '@alrehla/ui/textarea';
import DetailRow from '../shared/DetailRow';

type OrderWithRelations = Order & { child_profiles: { name: string } | null; users: { name: string, email: string } | null };

interface ViewOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: OrderWithRelations | null;
}

const emotionMap: { [key: string]: string } = {
    anger: 'الغضب', fear: 'الخوف', jealousy: 'الغيرة',
    frustration: 'الإحباط', anxiety: 'القلق', sadness: 'الحزن',
    respect: 'الاحترام', cooperation: 'التعاون', honesty: 'الصدق',
    courage: 'الشجاعة', curiosity: 'حب الاستطلاع', kindness: 'اللطف',
    patience: 'الصبر', responsibility: 'المسؤولية', gratitude: 'الامتنان'
};

const ViewOrderModal: React.FC<ViewOrderModalProps> = ({ isOpen, onClose, order }) => {
    const { updateOrderStatus, updateOrderComment } = useOrderMutations();
    const { data: products = [] } = useAdminPersonalizedProducts();
    const [comment, setComment] = useState('');

    useEffect(() => {
        if (order) {
            setComment(order.admin_comment || '');
        }
    }, [order]);

    if (!order) return null;

    const handleSaveComment = async () => {
        await updateOrderComment.mutateAsync({ orderId: order.id, comment });
    };

    const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        await updateOrderStatus.mutateAsync({ orderId: order.id, newStatus: e.target.value as OrderStatus });
    };

    const details = order.details as any || {};
    const age = calculateAge(details.childBirthDate);

    const statuses: OrderStatus[] = ["بانتظار الدفع", "بانتظار المراجعة", "قيد التجهيز", "يحتاج مراجعة", "قيد التنفيذ", "تم الشحن", "تم التسليم", "مكتمل", "ملغي"];
    
    // Resolve Goal Label
    const getGoalLabel = (val: string) => {
        if (!val) return 'غير محدد';
        if (val === 'custom') return 'هدف مخصص';
        
        // 1. Try to find in the specific product configuration
        const productKey = details.productKey;
        const product = products.find(p => p.key === productKey);
        if (product && product.story_goals) {
            const goal = product.story_goals.find((g: any) => g.key === val);
            if (goal) return goal.title;
        }

        // 2. Fallback
        return emotionMap[val] || val;
    };
    
    // Helper to format keys (e.g. child_photo_1 -> Child Photo 1)
    const formatLabel = (key: string) => {
        // Try to find label from product text fields if possible
        const productKey = details.productKey;
        const product = products.find(p => p.key === productKey);
        if (product && product.text_fields) {
            const fieldConfig = product.text_fields.find(f => f.id === key);
            if (fieldConfig) return fieldConfig.label;
        }

        return key
            .replace(/_/g, ' ')
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase());
    };

    // Fields we know are standard and handled in the top section
    const excludedFields = [
        'childName', 'childBirthDate', 'childGender', 'deliveryType', 'shippingOption', 
        'governorate', 'recipientName', 'recipientAddress', 'recipientPhone', 
        'recipientEmail', 'giftMessage', 'sendDigitalCard', 'storyValue', 'customGoal',
        'productKey'
    ];

    // Get all other custom fields (Dynamic Content)
    const customFields = Object.keys(details).filter(key => !excludedFields.includes(key));

    return (
        <Modal 
            isOpen={isOpen}
            onClose={onClose}
            title={`تفاصيل الطلب: ${order.id}`}
            size="3xl"
        >
             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <div className="space-y-2">
                    <h3 className="font-bold text-lg border-b pb-2 mb-2">معلومات العميل والطفل</h3>
                    <DetailRow label="العميل" value={order.users?.name} />
                    <DetailRow label="البريد الإلكتروني" value={order.users?.email} />
                    <DetailRow label="الطفل" value={details.childName || order.child_profiles?.name} />
                    <DetailRow label="العمر" value={age !== null ? `${age} سنوات` : 'غير محدد'} />
                    <DetailRow label="الجنس" value={details.childGender} />
                </div>

                <div className="space-y-2">
                    <h3 className="font-bold text-lg border-b pb-2 mb-2">تفاصيل الطلب</h3>
                    <DetailRow label="التاريخ" value={formatDate(order.order_date)} />
                    <DetailRow label="الملخص" value={order.item_summary} />
                    <DetailRow label="الإجمالي" value={`${order.total} ج.م`} />
                    <DetailRow label="الحالة" value={
                        <Select value={order.status} onChange={handleStatusChange} className={`p-1 border rounded-md text-sm ${getStatusColor(order.status)}`}>
                            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </Select>
                    } />
                     {order.receipt_url && <DetailRow label="الإيصال" value={<a href={order.receipt_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1"><LinkIcon size={14}/><span>عرض</span></a>} />}
                </div>
            </div>
            
             <div className="mt-6 space-y-2">
                <h3 className="font-bold text-lg border-b pb-2 mb-2">بيانات التخصيص</h3>
                
                {/* 1. Goal (if exists) */}
                {details.storyValue && (
                    <DetailRow label="الهدف من القصة" value={getGoalLabel(details.storyValue)} />
                )}
                {details.customGoal && (
                    <DetailRow label="الهدف المخصص" value={details.customGoal} isTextArea />
                )}

                {/* 2. Dynamic Custom Fields (e.g. Dedication, Story Inputs) */}
                <div className="grid grid-cols-1 gap-y-2">
                    {customFields.map(key => (
                        <DetailRow 
                            key={key} 
                            // Try to format key from camelCase to readable label if possible, or just use key
                            label={formatLabel(key)} 
                            value={details[key]} 
                            isTextArea={typeof details[key] === 'string' && details[key].length > 50} 
                        />
                    ))}
                </div>
            </div>
            
            {details.shippingOption === 'gift' && (
                <div className="mt-6 space-y-2">
                    <h3 className="font-bold text-lg border-b pb-2 mb-2">تفاصيل الهدية</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        <DetailRow label="اسم المستلم" value={details.recipientName} />
                        <DetailRow label="هاتف المستلم" value={details.recipientPhone} />
                        <DetailRow label="عنوان المستلم" value={details.recipientAddress} isTextArea />
                        <DetailRow label="بريد المستلم الإلكتروني" value={details.recipientEmail} />
                        <DetailRow label="رسالة الهدية" value={details.giftMessage} isTextArea />
                        <DetailRow label="إرسال بطاقة رقمية" value={details.sendDigitalCard ? 'نعم' : 'لا'} />
                    </div>
                </div>
            )}

            <div className="mt-6">
                <h3 className="font-bold text-lg mb-2">ملاحظات إدارية</h3>
                <Textarea value={comment} onChange={e => setComment(e.target.value)} rows={3} placeholder="أضف ملاحظات داخلية هنا..."></Textarea>
                <Button onClick={handleSaveComment} loading={updateOrderComment.isPending} variant="outline" size="sm" icon={<Save size={16}/>} className="mt-2">
                   حفظ الملاحظة
                </Button>
            </div>
        </Modal>
    );
};

export default ViewOrderModal;
