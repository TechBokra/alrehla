import * as React from 'react';
import { Button, type ButtonProps } from '../ui/button';

export interface SubmitButtonProps extends ButtonProps {
  pending?: boolean;
  pendingText?: React.ReactNode;
}

const SubmitButton = React.forwardRef<HTMLButtonElement, SubmitButtonProps>(({ pending = false, pendingText, children, loading, type = 'submit', ...props }, ref) => (
  <Button ref={ref} type={type} loading={loading || pending} disabled={props.disabled || pending || loading} {...props}>
    {pending && pendingText ? pendingText : children}
  </Button>
));
SubmitButton.displayName = 'SubmitButton';

export { SubmitButton };
