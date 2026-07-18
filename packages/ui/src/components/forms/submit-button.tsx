import * as React from 'react';
import { Button, type ButtonProps } from '../ui/button';

export interface SubmitButtonProps extends ButtonProps {
  pending?: boolean;
  pendingText?: React.ReactNode;
  loading?: boolean;
}

import { Loader2 } from 'lucide-react';

const SubmitButton = React.forwardRef<HTMLButtonElement, SubmitButtonProps>(({ pending = false, pendingText, children, loading, type = 'submit', ...props }, ref) => (
  <Button ref={ref} type={type} disabled={props.disabled || pending || loading} {...props}>
    {(loading || pending) && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
    {pending && pendingText ? pendingText : children}
  </Button>
));
SubmitButton.displayName = 'SubmitButton';

export { SubmitButton };
