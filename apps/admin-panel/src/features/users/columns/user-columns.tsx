import type { ColumnDef } from '@tanstack/react-table';
import { AlertTriangle, Link2Off, UserCheck } from 'lucide-react';
import { roleNames } from '../../../lib/roles';
import type { AdminUserRow } from '@alrehla/api/view-models/user';

export const userColumns: ColumnDef<AdminUserRow, unknown>[] = [
  {
    accessorKey: 'name',
    header: 'الاسم',
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.name}</div>
        {row.original.role === 'student' && (
          <div className="mt-1">
            {row.original.relatedChildName ? (
              <div className="flex w-fit items-start gap-1 rounded border border-blue-100 bg-blue-50 px-2 py-1 text-[10px] text-blue-700" title={`البريد: ${row.original.parentEmail || 'غير متوفر'}`}>
                <UserCheck size={12} className="mt-0.5" />
                <div>
                  <span className="block font-bold">مرتبط بـ: {row.original.relatedChildName}</span>
                  {row.original.parentName ? <span className="block text-[9px] opacity-75">ولي الأمر: {row.original.parentName}</span> : <span className="block text-[9px] font-bold text-orange-600"><AlertTriangle size={8} className="me-1 inline" />بيانات الأب غير محملة</span>}
                </div>
              </div>
            ) : (
              <div className="flex w-fit items-center gap-1 rounded-full border border-red-100 bg-red-50 px-2 py-0.5 text-[9px] font-bold text-red-600"><Link2Off size={10} />غير مرتبط بولي أمر!</div>
            )}
          </div>
        )}
      </div>
    ),
  },
  { accessorKey: 'email', header: 'البريد الإلكتروني', cell: ({ row }) => <span className="font-mono text-xs">{row.original.email}</span> },
  { accessorKey: 'role', header: 'الرتبة', cell: ({ row }) => <span className="inline-flex w-fit rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-bold text-foreground">{roleNames[row.original.role]}</span> },
  {
    accessorKey: 'totalChildrenCount',
    header: 'بيانات مرتبطة',
    cell: ({ row }) => {
      const user = row.original;
      if (user.role === 'student') return <span className="text-[10px] text-muted-foreground">-</span>;
      if (user.role === 'publisher') return <span className="text-[10px] text-muted-foreground">ملف الدار + المنتجات</span>;
      return user.totalChildrenCount > 0 ? <span className="text-[10px] font-bold text-gray-700">{user.totalChildrenCount} ملف طفل</span> : <span className="text-[10px] italic text-muted-foreground">لا يوجد أطفال</span>;
    },
  },
];
