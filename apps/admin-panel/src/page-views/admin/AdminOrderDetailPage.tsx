'use client';
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  useAdminOrders,
  useAdminPersonalizedProducts,
} from '../../hooks/queries/admin/useAdminEnhaLakQuery';
import { useOrderMutations } from '../../hooks/mutations/useOrderMutations';
import PageLoader from '@alrehla/ui/page-loader';
import ErrorState from '@alrehla/ui/error-state';
import { Button } from '@alrehla/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@alrehla/ui/card';
import { Select } from '@alrehla/ui/native-select';
import { Textarea } from '@alrehla/ui/textarea';
import { ArrowLeft, Save, Link as LinkIcon, ShoppingBag, ExternalLink } from 'lucide-react';
import DetailRow from '../../components/shared/DetailRow';
import { formatDate, getStatusColor, calculateAge } from '../../utils/helpers';
import type { OrderStatus } from '../../lib/database.types';

const createNavigate =
  (router: ReturnType<typeof useRouter>) =>
  (href: string | number, options?: { replace?: boolean }) => {
    if (typeof href === 'number') {
      router.back();
      return;
    }

    const target = href || '/';
    if (options?.replace) router.replace(target);
    else router.push(target);
  };

const orderStatuses: OrderStatus[] = [
  'بانتظار الدفع',
  'بانتظار المراجعة',
  'قيد التجهيز',
  'يحتاج مراجعة',
  'قيد التنفيذ',
  'تم الشحن',
  'تم التسليم',
  'مكتمل',
  'ملغي',
];

// Legacy map for older orders
const emotionMap: { [key: string]: string } = {
  anger: 'الغضب',
  fear: 'الخوف',
  jealousy: 'الغيرة',
  frustration: 'الإحباط',
  anxiety: 'القلق',
  sadness: 'الحزن',
  respect: 'الاحترام',
  cooperation: 'التعاون',
  honesty: 'الصدق',
  courage: 'الشجاعة',
  curiosity: 'حب الاستطلاع',
  kindness: 'اللطف',
  patience: 'الصبر',
  responsibility: 'المسؤولية',
  gratitude: 'الامتنان',
};

const AdminOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const navigate = createNavigate(router);

  // Correctly extract data. data structure is { orders: [], count: number }
  const { data, isLoading } = useAdminOrders();
  const orders = data?.orders || [];

  // Fetch products to resolve dynamic goal names
  const { data: products = [] } = useAdminPersonalizedProducts();

  const { updateOrderStatus, updateOrderComment } = useOrderMutations();

  const [comment, setComment] = useState('');
  const [status, setStatus] = useState<OrderStatus>('بانتظار المراجعة');

  // Find the specific order from the cached list
  const order = orders.find((o) => o.id === id);

  useEffect(() => {
    if (order) {
      setComment(order.admin_comment || '');
      setStatus(order.status);
    }
  }, [order]);

  const handleSave = async () => {
    const promises = [];
    if (status !== order?.status) {
      promises.push(updateOrderStatus.mutateAsync({ orderId: order!.id, newStatus: status }));
    }
    if (comment !== (order?.admin_comment || '')) {
      promises.push(updateOrderComment.mutateAsync({ orderId: order!.id, comment }));
    }
    await Promise.all(promises);
  };

  if (isLoading) return <PageLoader text="جاري تحميل تفاصيل الطلب..." />;

  if (!order) {
    return (
      <ErrorState
        title="الطلب غير موجود"
        message="لم يتم العثور على الطلب المطلوب. قد يكون تم حذفه."
        onRetry={() => navigate('/orders')}
      />
    );
  }

  const details = (order.details as any) || {};
  const age = calculateAge(details.childBirthDate);

  // Resolve Goal Label
  const getGoalLabel = (val: string) => {
    if (!val) return 'غير محدد';
    if (val === 'custom') return 'هدف مخصص (أنظر أدناه)';

    // 1. Try to find in the specific product configuration (if productKey is linked)
    if (details.productKey) {
      const product = products.find((p) => p.key === details.productKey);
      if (product && product.story_goals) {
        const goal = product.story_goals.find((g: any) => g.key === val);
        if (goal) return goal.title;
      }
    }

    // 2. Global Search: Try to find the goal key in ANY product
    // This fixes cases where productKey is missing in older orders or mismatch occurs
    for (const prod of products) {
      if (prod.story_goals) {
        const goal = prod.story_goals.find((g: any) => g.key === val);
        if (goal) return goal.title;
      }
    }

    // 3. Fallback to legacy static map or return value itself
    return emotionMap[val] || val;
  };

  // Filter out standard fields to show custom ones
  const excludedFields = [
    'childName',
    'childBirthDate',
    'childGender',
    'deliveryType',
    'shippingOption',
    'governorate',
    'recipientName',
    'recipientAddress',
    'recipientPhone',
    'recipientEmail',
    'giftMessage',
    'sendDigitalCard',
    'storyValue',
    'customGoal',
    'productKey',
  ];
  const customFields = Object.keys(details).filter((key) => !excludedFields.includes(key));

  // Helper to check if string is an image URL
  const isImageUrl = (url: any) => {
    if (typeof url !== 'string') return false;
    return (
      url.match(/\.(jpeg|jpg|gif|png|webp)$/i) ||
      url.includes('cloudinary.com') ||
      url.includes('blob:')
    );
  };

  // Helper to format keys (e.g. child_photo_1 -> Child Photo 1)
  const formatLabel = (key: string) => {
    // Try to find label from product text fields if possible
    const productKey = details.productKey;
    if (productKey) {
      const product = products.find((p) => p.key === productKey);
      if (product && product.text_fields) {
        const fieldConfig = product.text_fields.find((f) => f.id === key);
        if (fieldConfig) return fieldConfig.label;
      }
    } else {
      // Fallback search for label across all products if key matches
      for (const prod of products) {
        const field = prod.text_fields?.find((f) => f.id === key);
        if (field) return field.label;
      }
    }

    return key
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase());
  };

  return (
    <div className="animate-fadeIn space-y-8 max-w-5xl mx-auto pb-20">
      <Link
        href="/orders"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-semibold"
      >
        <ArrowLeft size={16} /> العودة لقائمة الطلبات
      </Link>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-3">
          <ShoppingBag /> تفاصيل الطلب:{' '}
          <span className="font-mono text-2xl text-muted-foreground">#{order.id.slice(0, 8)}</span>
        </h1>
        <div className="flex items-center gap-2">
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value as OrderStatus)}
            className={`w-48 font-bold ${getStatusColor(status)}`}
          >
            {orderStatuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          <Button
            onClick={handleSave}
            loading={updateOrderStatus.isPending || updateOrderComment.isPending}
            icon={<Save size={18} />}
          >
            حفظ التغييرات
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>بيانات العميل والطفل</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 border-b pb-1">العميل</h4>
                  <DetailRow label="الاسم" value={order.users?.name} />
                  <DetailRow label="البريد" value={order.users?.email} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 border-b pb-1">الطفل</h4>
                  <DetailRow
                    label="الاسم"
                    value={details.childName || order.child_profiles?.name}
                  />
                  <DetailRow label="العمر" value={age !== null ? `${age} سنوات` : 'غير محدد'} />
                  <DetailRow label="الجنس" value={details.childGender} />
                  <DetailRow label="تاريخ الميلاد" value={details.childBirthDate} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>بيانات التخصيص والقصة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(details.storyValue || details.customGoal) && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
                  {details.storyValue && (
                    <DetailRow label="الهدف المختار" value={getGoalLabel(details.storyValue)} />
                  )}
                  {details.customGoal && (
                    <DetailRow
                      label="الهدف المخصص (كتابة العميل)"
                      value={details.customGoal}
                      isTextArea
                    />
                  )}
                </div>
              )}

              <div className="space-y-6">
                {customFields.map((key) => {
                  const value = details[key];
                  const isImage = isImageUrl(value);

                  return (
                    <DetailRow
                      key={key}
                      label={formatLabel(key)}
                      value={
                        isImage ? (
                          <div className="mt-2">
                            <a
                              href={value}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group relative inline-block border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all"
                            >
                              <img
                                src={value}
                                alt={key}
                                className="w-40 h-40 object-cover bg-gray-100"
                              />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-semibold">
                                <span className="flex items-center gap-1 text-sm">
                                  <ExternalLink size={14} /> فتح
                                </span>
                              </div>
                            </a>
                            <p
                              className="text-xs text-muted-foreground mt-1 font-mono truncate max-w-md"
                              dir="ltr"
                            >
                              {value}
                            </p>
                          </div>
                        ) : typeof value === 'object' && value !== null ? (
                          <pre className="text-xs p-2 bg-gray-50 border rounded-md mt-1 overflow-auto max-h-40" dir="ltr">
                            {JSON.stringify(value, null, 2)}
                          </pre>
                        ) : (
                          String(value)
                        )
                      }
                      isTextArea={!isImage && typeof value === 'string' && value.length > 50}
                    />
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="lg:col-span-1 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>ملخص الطلب</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <DetailRow label="المنتج" value={order.item_summary} />
              <DetailRow label="تاريخ الطلب" value={formatDate(order.order_date)} />
              <DetailRow label="الإجمالي" value={`${order.total} ج.م`} />
              {order.receipt_url && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-semibold text-muted-foreground mb-2">إيصال الدفع:</p>
                  <a
                    href={order.receipt_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full group"
                  >
                    <div className="relative rounded-md overflow-hidden border">
                      <img
                        src={order.receipt_url}
                        alt="Receipt"
                        className="w-full h-32 object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    </div>
                    <div className="flex items-center justify-center gap-1 text-primary text-sm mt-1 font-semibold">
                      <LinkIcon size={14} /> عرض الإيصال كاملاً
                    </div>
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {details.shippingOption === 'gift' && (
            <Card className="bg-purple-50 border-purple-200">
              <CardHeader>
                <CardTitle className="text-purple-900">بيانات الهدية</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <DetailRow label="المستلم" value={details.recipientName} />
                <DetailRow label="العنوان" value={details.recipientAddress} isTextArea />
                <DetailRow label="الهاتف" value={details.recipientPhone} />
                <DetailRow label="رسالة" value={details.giftMessage} isTextArea />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>ملاحظات إدارية</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={6}
                placeholder="أضف ملاحظات داخلية لفريق العمل..."
                className="mb-2"
              />
              <Button
                onClick={handleSave}
                variant="outline"
                size="sm"
                className="w-full"
                loading={updateOrderComment.isPending}
              >
                حفظ الملاحظة فقط
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetailPage;
