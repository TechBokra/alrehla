import { Home } from 'lucide-react';
import { Button } from './components/ui/button';
import { ErrorState as BaseErrorState, type ErrorStateProps as BaseErrorStateProps } from './components/layout/error-state';

export interface ErrorStateProps extends Omit<BaseErrorStateProps, 'action'> {
  homeHref?: string;
  homeLabel?: string;
}

import Link from 'next/link';

export default function ErrorState({ title = 'عذراً، حدث خطأ ما', retryLabel = 'إعادة المحاولة', homeHref = '/', homeLabel = 'العودة للرئيسية', ...props }: ErrorStateProps) {
  return (
    <BaseErrorState
      title={title}
      retryLabel={retryLabel}
      action={homeHref ? (
        <Button variant="ghost" asChild>
          <Link href={homeHref} className="inline-flex items-center gap-2">
            <Home className="h-4 w-4" />
            {homeLabel}
          </Link>
        </Button>
      ) : undefined}
      {...props}
    />
  );
}

export { BaseErrorState as ErrorState };
