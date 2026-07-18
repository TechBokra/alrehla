
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useAdminSupportTickets } from '../../hooks/queries/admin/useAdminCommunicationQuery';
import { useCommunicationMutations } from '../../hooks/mutations/useCommunicationMutations';
import PageLoader from '@alrehla/ui/page-loader';
import ErrorState from '@alrehla/ui/error-state';
import { Button } from '@alrehla/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@alrehla/ui/card';
import { Select } from '@alrehla/ui/native-select';
import { ArrowLeft, Save, MessageSquare, Mail } from 'lucide-react';
import DetailRow from '../../components/shared/DetailRow';
import { formatDate } from '../../utils/helpers';
import type { TicketStatus } from '../../lib/database.types';

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

const ticketStatuses: TicketStatus[] = ["جديدة", "تمت المراجعة", "مغلقة"];

const AdminTicketDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const navigate = createNavigate(router);
    const { data: tickets = [], isLoading } = useAdminSupportTickets();
    const { updateSupportTicketStatus } = useCommunicationMutations();

    const [status, setStatus] = useState<TicketStatus>('جديدة');

    const ticket = tickets.find(t => t.id === id);

    useEffect(() => {
        if (ticket) {
            setStatus(ticket.status);
        }
    }, [ticket]);

    if (isLoading) return <PageLoader text="جاري تحميل الرسالة..." />;

    if (!ticket) {
        return <ErrorState message="لم يتم العثور على الرسالة." onRetry={() => navigate('/support')} />;
    }

    const handleSave = async () => {
        await updateSupportTicketStatus.mutateAsync({ ticketId: ticket.id, newStatus: status });
    };

    return (
        <div className="animate-fadeIn space-y-8 max-w-3xl mx-auto pb-20">
            <Link href="/support" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-semibold">
                <ArrowLeft size={16} /> العودة لقائمة الرسائل
            </Link>

            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-3">
                    <MessageSquare /> تفاصيل الرسالة
                </h1>
                <div className="flex items-center gap-2">
                    <Select value={status} onChange={(e) => setStatus(e.target.value as TicketStatus)} className="w-40 font-bold">
                        {ticketStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </Select>
                    <Button onClick={handleSave} loading={updateSupportTicketStatus.isPending} icon={<Save size={18} />}>
                        تحديث الحالة
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>معلومات المرسل</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <DetailRow label="الاسم" value={ticket.name} />
                    <DetailRow label="البريد الإلكتروني" value={ticket.email} />
                    <div className="mt-4">
                        <a href={`mailto:${ticket.email}`} className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3">
                            <Mail size={16} className="mr-2"/>
                            إرسال رد عبر البريد
                        </a>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>محتوى الرسالة</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <DetailRow label="الموضوع" value={ticket.subject} />
                    <DetailRow label="تاريخ الإرسال" value={formatDate(ticket.created_at)} />
                    <div className="pt-4 border-t">
                        <p className="font-semibold text-muted-foreground mb-2">الرسالة:</p>
                        <div className="p-4 bg-gray-50 rounded-lg border text-gray-800 whitespace-pre-wrap leading-relaxed">
                            {ticket.message}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminTicketDetailPage;
