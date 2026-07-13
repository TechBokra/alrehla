"use client";

import React from 'react';
import { Edit, Trash2, UserPlus } from 'lucide-react';
import type { ChildProfile } from '../../lib/database.types';
import { Button } from '../ui/Button';
import Image from '../ui/Image';

interface ChildCardProps {
    child: ChildProfile;
    onEdit: (child: ChildProfile) => void;
    onDelete: (childId: number) => void;
    onCreateStudentAccount: (child: ChildProfile) => void;
}

const ChildCard: React.FC<ChildCardProps> = ({ child, onEdit, onDelete, onCreateStudentAccount }) => {
    return (
        <div className="bg-white p-4 rounded-2xl shadow-md border flex flex-col sm:flex-row items-center gap-4">
            <Image 
                src={child.avatar_url || '/images/male-avatar.png'} 
                alt={child.name} 
                className="w-20 h-20 rounded-full border-2 border-blue-100"
                loading="lazy"
            />
            <div className="flex-grow text-center sm:text-right">
                <h3 className="text-xl font-bold text-gray-800">{child.name}</h3>
                <p className="text-gray-500">{child.age} سنوات</p>
                 {child.student_user_id ? (
                    <span className="text-xs font-semibold bg-green-100 text-green-800 px-2 py-1 rounded-full inline-block mt-2">حساب طالب مفعل</span>
                ) : null}
            </div>
            <div className="flex-shrink-0 flex flex-col sm:flex-row items-center gap-2">
                 {!child.student_user_id && (
                    <Button variant="outline" size="sm" onClick={() => onCreateStudentAccount(child)} icon={<UserPlus size={16} />}>
                        إنشاء حساب
                    </Button>
                )}
                <div className="flex gap-1">
                    <button onClick={() => onEdit(child)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-full" aria-label={`تعديل ${child.name}`}>
                        <Edit size={18} />
                    </button>
                    <button onClick={() => onDelete(child.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-full" aria-label={`حذف ${child.name}`}>
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChildCard;