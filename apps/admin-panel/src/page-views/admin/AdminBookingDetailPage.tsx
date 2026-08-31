
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useAdminRawCwBookings } from '../../hooks/queries/admin/useAdminBookingsQuery';
import { useBookingMutations } from '../../hooks/mutations/useBookingMutations';
import PageLoader from '@alrehla/ui/page-loader';
import ErrorState from '@alrehla/ui/error-state';
import { Button } from '@alrehla/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@alrehla/ui/card';
import { Select } from '@alrehla/ui/native-select';
import { Textarea } from '@alrehla/ui/textarea';
import { ArrowLeft, Save, Link as LinkIcon, BookOpen, ExternalLink, Users } from 'lucide-react';
import DetailRow from '../../components/shared/DetailRow';
import { formatDate, getStatusColor } from '../../utils/helpers';
import type { BookingStatus } from '../../lib/database.types';
import { getMarketplaceUrl } from '../../lib/marketplaceUrl';
import { toCanonicalBookingStatus } from '@alrehla/api-client/resources/bookings';

const createNavigate = (router: ReturnType<typeof useRouter>) => (
    href: string | number,
    options?: { replace?: boolean },
) => {
    if (typeof href === 'number') {
        router.back();
        return;
    }

    const target = href || '/';
    if (options?.replace) router.replace(target);
    else router.push(target);
};

const bookingStatuses: BookingStatus[] = ["بانتظار الدفع", "بانتظار المراجعة", "مؤكد", "مكتمل", "ملغي"];

const AdminBookingDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const navigate = createNavigate(router);
    
    // We fetch just this specific booking or rely on cache if we had a "getById" hook.
    // Since we don't, we can try to find it in the current list OR fetch it.
    // For simplicity with the new hook, we can search by ID.
    const { data, isLoading: bookingsLoading } = useAdminRawCwBookings({ search: id, page: 1, pageSize: 1 });
    
    const { updateBookingStatus, updateBookingProgressNotes } = useBookingMutations();

    const [status, setStatus] = useState<BookingStatus>('بانتظار الدفع');
    const [progressNotes, setProgressNotes] = useState('');

    const booking: any = data?.bookings?.[0]; // Access the first (and likely only) booking

    useEffect(() => {
        if (booking) {
            setStatus(booking.status);
            setProgressNotes(booking.progress_notes || '');
        }
    }, [booking]);

    if (bookingsLoading) return <PageLoader text="جاري تحميل تفاصيل الحجز..." />;

    if (!booking) {
        return <ErrorState message="لم يتم العثور على الحجز." onRetry={() => navigate('/creative-writing')} />;
    }

    const handleSave = async () => {
        const promises = [];
        if (status !== booking.status) {
            promises.push(updateBookingStatus.mutateAsync({ bookingId: booking.id, newStatus: toCanonicalBookingStatus(status) }));
        }
        if (progressNotes !== (booking.progress_notes || '')) {
            promises.push(updateBookingProgressNotes.mutateAsync({ bookingId: booking.id, notes: progressNotes }));
        }
        await Promise.all(promises);
    };

    return (
        <div className="animate-fadeIn space-y-8 max-w-4xl mx-auto pb-20">
            <Link href="/creative-writing" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-semibold">
                <ArrowLeft size={16} /> العودة لقائمة الحجوزات
            </Link>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-3">
                    <BookOpen /> تفاصيل الحجز: <span className="font-mono text-2xl text-muted-foreground">{booking.id}</span>
                </h1>
                <div className="flex items-center gap-2">
                    <Select 
                        value={status} 
                        onChange={(e) => setStatus(e.target.value as BookingStatus)} 
                        className={`w-48 font-bold ${getStatusColor(status)}`}
                    >
                        {bookingStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </Select>
                    <Button onClick={handleSave} loading={updateBookingStatus.isPending || updateBookingProgressNotes.isPending} icon={<Save size={18} />}>
                        حفظ التغييرات
                    </Button>
                </div>
            </div>
            
            {/* مساحة العمل لا تصبح نشطة قبل التأكيد. */}
            {(booking.status === 'مؤكد' || booking.status === 'مكتمل') && <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                        <Users size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-blue-900">مساحة العمل المشتركة</h3>
                        <p className="text-sm text-blue-700">مراجعة المحادثات، المرفقات، ومسودة الطالب في هذه الرحلة.</p>
                    </div>
                </div>
                <Button 
                    as={Link} 
                    href={getMarketplaceUrl(`/journey/${booking.id}`)}
                    variant="outline" 
                    className="bg-white border-blue-300 text-blue-700 hover:bg-blue-50"
                    icon={<ExternalLink size={16} />}
                >
                    دخول للمراجعة
                </Button>
            </div>}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>بيانات الحجز الأساسية</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <DetailRow label="الطالب" value={booking.child_profiles?.name || 'N/A'} />
                        <DetailRow label="ولي الأمر" value={booking.users?.name || booking.user_id} />
                        <DetailRow label="البريد الإلكتروني" value={booking.users?.email} />
                        <DetailRow label="المدرب" value={booking.instructors?.name || 'N/A'} />
                        <DetailRow label="الباقة" value={booking.package_name} />
                        <DetailRow label="موعد الجلسة" value={`${formatDate(booking.booking_date)} الساعة ${booking.booking_time}`} />
                        <DetailRow label="الإجمالي" value={`${booking.total} ج.م`} />
                    </CardContent>
                </Card>

                <div className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>الإيصال والمرفقات</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {booking.receipt_url ? (
                                <div className="space-y-2">
                                    <p className="text-sm font-semibold text-muted-foreground">إيصال الدفع:</p>
                                    <a href={booking.receipt_url} target="_blank" rel="noopener noreferrer" className="block w-full">
                                        <img src={booking.receipt_url} alt="Receipt" className="w-full h-32 object-cover rounded-md border hover:opacity-90 transition-opacity" />
                                        <div className="flex items-center justify-center gap-1 text-primary text-sm mt-1">
                                            <LinkIcon size={14}/> عرض الإيصال كاملاً
                                        </div>
                                    </a>
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-sm">لا يوجد إيصال مرفق لهذا الحجز.</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>ملاحظات التقدم</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea 
                                value={progressNotes} 
                                onChange={e => setProgressNotes(e.target.value)} 
                                rows={6} 
                                placeholder="أضف ملاحظات حول تقدم الطالب في هذه الجلسة/الباقة..." 
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default AdminBookingDetailPage;
