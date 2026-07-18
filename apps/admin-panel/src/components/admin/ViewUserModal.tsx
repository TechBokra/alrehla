import React from 'react';
import { Mail, User, Shield } from 'lucide-react';
import type { UserProfileWithRelations } from '../../lib/database.types';
import { roleNames } from '../../lib/roles';
import { calculateAge } from '../../utils/helpers';
import Modal from '@alrehla/ui/modal';
import { Button } from '@alrehla/ui/button';
import DetailRow from '../shared/DetailRow';

interface ViewUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: UserProfileWithRelations | null;
}

const ViewUserModal: React.FC<ViewUserModalProps> = ({ isOpen, onClose, user }) => {
    if (!user) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="تفاصيل المستخدم"
            footer={<Button onClick={onClose}>إغلاق</Button>}
        >
            <div className="space-y-4">
                <DetailRow label="الاسم" value={user.name} />
                <DetailRow label="البريد الإلكتروني" value={user.email} />
                <DetailRow label="الدور" value={roleNames[user.role]} />
                
                {user.children && user.children.length > 0 && (
                    <div>
                            <p className="text-sm font-semibold text-muted-foreground my-2">الأطفال المرتبطون:</p>
                            <div className="space-y-2">
                            {user.children.map(child => {
                                const age = calculateAge(child.birth_date);
                                return (
                                    <div key={child.id} className="p-2 bg-muted rounded-md text-sm">{child.name} ({age !== null ? `${age} سنوات` : ''})</div>
                                );
                            })}
                            </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default ViewUserModal;