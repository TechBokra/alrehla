'use client';

import React from 'react';
import { ErrorState } from '@alrehla/ui';

interface AuthStatePanelProps {
  title: React.ReactNode;
  message: React.ReactNode;
  onRetry?: () => void;
  retryLabel?: React.ReactNode;
  action?: React.ReactNode;
}

export default function AuthStatePanel({
  title,
  message,
  onRetry,
  retryLabel = 'إعادة المحاولة',
  action,
}: AuthStatePanelProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6" dir="rtl">
      <ErrorState
        title={title}
        message={message}
        onRetry={onRetry}
        retryLabel={retryLabel}
        action={action}
      />
    </div>
  );
}
