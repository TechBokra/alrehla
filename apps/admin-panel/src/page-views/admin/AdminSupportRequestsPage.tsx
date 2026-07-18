import React from 'react';
import { ShieldQuestion, Check, X } from 'lucide-react';
import { useAdminSupportSessionRequests } from '../../hooks/queries/admin/useAdminCommunicationQuery';
import { useInstructorMutations } from '../../hooks/mutations/useInstructorMutations';
import PageLoader from '@alrehla/ui/page-loader';
import { Button } from '@alrehla/ui/button';
import { formatDate } from '../../utils/helpers';
import type { SupportSessionRequest } from '../../lib/database.types';
import { Card, CardHeader, CardTitle, CardContent } from '@alrehla/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@alrehla/ui/table';
import ErrorState from '@alrehla/ui/error-state';

const AdminSupportRequestsPage: React.FC = () => {
    const { data: requests = [], isLoading, error, refetch } = useAdminSupportSessionRequests();
    const { approveSupportSessionRequest, rejectSupportSessionRequest } = useInstructorMutations();

    if (isLoading) {
        return <PageLoader text="جاري تحميل طلبات الدعم..." />;
    }

    if (error) {
        return <ErrorState message={(error as Error).message} onRetry={refetch} />;
    }

    const getStatusInfo = (status: SupportSessionRequest['status']) => {
        switch (status) {
            case 'approved': return { text: 'تمت الموافقة', color: 'bg-green-100 text-green-800' };
            case 'rejected': return { text: 'مرفوض', color: 'bg-red-100 text-red-800' };
            case 'pending': return { text: 'معلق', color: 'bg-yellow-100 text-yellow-800' };
            default: return { text: status, color: 'bg-gray-100 text-gray-800' };
        }
    };

    return (
        <div className="animate-fadeIn space-y-8">
            <h1 className="text-3xl font-extrabold text-foreground">مراجعة طلبات جلسات الدعم</h1>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ShieldQuestion /> كل الطلبات</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>المدرب</TableHead>
                                    <TableHead>الطالب</TableHead>
                                    <TableHead>السبب</TableHead>
                                    <TableHead>التاريخ</TableHead>
                                    <TableHead>الحالة</TableHead>
                                    <TableHead>إجراء</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {requests.map((req: any) => {
                                    const statusInfo = getStatusInfo(req.status);
                                    return (
                                        <TableRow key={req.id}>
                                            <TableCell className="font-semibold">{req.instructor_name}</TableCell>
                                            <TableCell className="font-semibold">{req.child_name}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground max-w-sm truncate">{req.reason}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{formatDate(req.requested_at)}</TableCell>
                                            <TableCell>
                                                <span className={`px-2 py-1 text-xs font-bold rounded-full ${statusInfo.color}`}>
                                                    {statusInfo.text}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {req.status === 'pending' && (
                                                    <div className="flex gap-2">
                                                        <Button variant="success" size="icon" onClick={() => approveSupportSessionRequest.mutate({ requestId: req.id })} title="موافقة">
                                                            <Check size={18} />
                                                        </Button>
                                                        <Button variant="destructive" size="icon" onClick={() => rejectSupportSessionRequest.mutate({ requestId: req.id })} title="رفض">
                                                            <X size={18} />
                                                        </Button>
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                        {requests.length === 0 && <p className="text-center py-8 text-muted-foreground">لا توجد طلبات دعم حاليًا.</p>}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminSupportRequestsPage;