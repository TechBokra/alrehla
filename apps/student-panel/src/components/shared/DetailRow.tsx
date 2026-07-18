import React from 'react';

interface DetailRowProps {
    label: string;
    value: React.ReactNode;
    isTextArea?: boolean;
}

const DetailRow: React.FC<DetailRowProps> = ({ label, value, isTextArea = false }) => (
    <div className="py-2 first:pt-0 last:pb-0">
        <p className="text-sm font-semibold text-muted-foreground mb-1">{label}:</p>
        {isTextArea ? (
            <div className="text-foreground mt-1 whitespace-pre-wrap bg-muted/50 p-2 rounded-lg text-sm leading-relaxed border">{value || 'N/A'}</div>
        ) : (
            <div className="text-foreground font-medium break-all">{value || 'N/A'}</div>
        )}
    </div>
);

export default DetailRow;
