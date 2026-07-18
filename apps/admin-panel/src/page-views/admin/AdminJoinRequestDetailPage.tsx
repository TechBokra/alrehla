
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useAdminJoinRequests } from '../../hooks/queries/admin/useAdminCommunicationQuery';
import { useCommunicationMutations } from '../../hooks/mutations/useCommunicationMutations';
import PageLoader from '@alrehla/ui/page-loader';
import ErrorState from '@alrehla/ui/error-state';
import { Button } from '@alrehla/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@alrehla/ui/card';
import { Select } from '@alrehla/ui/native-select';
import { ArrowLeft, Save, UserPlus, Link as LinkIcon, Mail } from 'lucide-react';
import DetailRow from '../../components/shared/DetailRow';
import { formatDate } from '../../utils/helpers';
import type { RequestStatus } from '../../lib/database.types';

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

const requestStatuses: RequestStatus[] = ["جديد", "تمت المراجعة", "مقبول", "مرفوض"];

const AdminJoinRequestDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const navigate = createNavigate(router);
    const { data: requests = [], isLoading } = useAdminJoinRequests();
    const { updateJoinRequestStatus } = useCommunicationMutations();

    const [status, setStatus] = useState<RequestStatus>('جديد');

    const request = requests.find(r => r.id === id);

    useEffect(() => {
        if (request) {
            setStatus(request.status);
        }
    }, [request]);

    if (isLoading) return <PageLoader text="جاري تحميل الطلب..." />;

    if (!request) {
        return <ErrorState message="لم يتم العثور على طلب الانضمام." onRetry={() => navigate('/join-requests')} />;
    }

    const handleSave = async () => {
        await updateJoinRequestStatus.mutateAsync({ requestId: request.id, newStatus: status });
    };

    return (
        <div className="animate-fadeIn space-y-8 max-w-3xl mx-auto pb-20">
            <Link href="/join-requests" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-semibold">
                <ArrowLeft size={16} /> العودة لقائمة الطلبات
            </Link>

            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-3">
                    <UserPlus /> تفاصيل طلب الانضمام
                </h1>
                <div className="flex items-center gap-2">
                    <Select value={status} onChange={(e) => setStatus(e.target.value as RequestStatus)} className="w-40 font-bold">
                        {requestStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </Select>
                    <Button onClick={handleSave} loading={updateJoinRequestStatus.isPending} icon={<Save size={18} />}>
                        تحديث الحالة
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>المعلومات الشخصية</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <DetailRow label="الاسم" value={request.name} />
                    <DetailRow label="البريد الإلكتروني" value={request.email} />
                    <DetailRow label="رقم الهاتف" value={request.phone} />
                    <div className="mt-4">
                        <a href={`mailto:${request.email}`} className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3">
                            <Mail size={16} className="mr-2"/>
                            مراسلة المتقدم
                        </a>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>تفاصيل الطلب والخبرة</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <DetailRow label="الدور المطلوب" value={request.role} />
                    <DetailRow label="تاريخ التقديم" value={formatDate(request.created_at)} />
                    
                    {request.portfolio_url && (
                        <div className="py-2 border-b">
                            <p className="text-sm font-semibold text-muted-foreground">معرض الأعمال:</p>
                            <a href={request.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 mt-1 font-bold">
                                <LinkIcon size={16}/> <span>زيارة الرابط</span>
                            </a>
                        </div>
                    )}

                    <div className="pt-4 border-t">
                        <p className="font-semibold text-muted-foreground mb-2">رسالة المتقدم:</p>
                        <div className="p-4 bg-gray-50 rounded-lg border text-gray-800 whitespace-pre-wrap leading-relaxed">
                            {request.message}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminJoinRequestDetailPage;
