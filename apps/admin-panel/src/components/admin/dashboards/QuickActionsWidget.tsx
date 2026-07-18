import React from 'react';
import Link from 'next/link';
import AdminSection from '../AdminSection';
import { Button } from '@alrehla/ui/button';
import { PlusCircle, Gift, Edit, UserPlus } from 'lucide-react';

const QuickActionsWidget = React.forwardRef<HTMLElement, { permissions: any } & React.HTMLAttributes<HTMLElement>>(
    ({ permissions, ...props }, ref) => {

    const actions = [
        {
            label: 'منتج جديد',
            to: '/personalized-products/new',
            icon: <Gift size={18} />,
            permission: permissions.canManageEnhaLakProducts
        },
        {
            label: 'مقال جديد',
            to: '/blog', // The modal is opened from here
            icon: <Edit size={18} />,
            permission: permissions.canManageBlog
        },
        {
            label: 'مستخدم جديد',
            to: '/users', // The modal is opened from here
            icon: <UserPlus size={18} />,
            permission: permissions.canManageUsers
        }
    ].filter(action => action.permission);

    if (actions.length === 0) return null;

    return (
        <AdminSection ref={ref} title="إجراءات سريعة" icon={<PlusCircle />} {...props}>
            <div className="grid grid-cols-1 gap-3">
                {actions.map(action => (
                    <Button as={Link} href={action.to} key={action.to} variant="outline" className="justify-start">
                        {action.icon}
                        <span className="mr-2">{action.label}</span>
                    </Button>
                ))}
            </div>
        </AdminSection>
    );
});
QuickActionsWidget.displayName = "QuickActionsWidget";

export default QuickActionsWidget;
