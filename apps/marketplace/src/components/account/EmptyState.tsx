
import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@alrehla/ui/button';

interface EmptyStateProps {
    icon: React.ReactNode;
    title: string;
    message: string;
    actionText: string;
    onAction: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, message, actionText, onAction }) => {
    return (
        <div className="text-center py-16 px-6 bg-white rounded-2xl shadow-md border-2 border-dashed">
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gray-100">
                {icon}
            </div>
            <h3 className="mt-4 text-xl font-bold text-gray-800">{title}</h3>
            <p className="mt-2 text-gray-500 max-w-md mx-auto">{message}</p>
            <div className="mt-6">
                <Button
                    type="button"
                    onClick={onAction}
                    icon={<Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />}
                    size="lg"
                    className="shadow-sm transition-transform transform hover:scale-105"
                >
                    {actionText}
                </Button>
            </div>
        </div>
    );
};

export default EmptyState;
