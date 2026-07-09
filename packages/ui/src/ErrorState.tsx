import { Home } from 'lucide-react';
import { Button } from './components/ui/button';
import { ErrorState as BaseErrorState, type ErrorStateProps as BaseErrorStateProps } from './components/layout/error-state';

export interface ErrorStateProps extends Omit<BaseErrorStateProps, 'action'> {
  homeHref?: string;
  homeLabel?: string;
}

export default function ErrorState({ title = 'عذراً، حدث خطأ ما', retryLabel = 'إعادة المحاولة', homeHref = '/', homeLabel = 'العودة للرئيسية', ...props }: ErrorStateProps) {
  return (
    <BaseErrorState
      title={title}
      retryLabel={retryLabel}
      action={homeHref ? <Button href={homeHref} variant="ghost" icon={<Home />}>{homeLabel}</Button> : undefined}
      {...props}
    />
  );
}

export { BaseErrorState as ErrorState };
