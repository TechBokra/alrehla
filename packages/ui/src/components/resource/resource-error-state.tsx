import type * as React from 'react';
import ErrorState from '../layout/error-state';

export function ResourceErrorState({ message, onRetry }: { message: React.ReactNode; onRetry?: () => void }) {
  return <ErrorState message={message} onRetry={onRetry} retryLabel="إعادة المحاولة" />;
}
