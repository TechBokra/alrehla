import * as React from "react";
import { Button, type ButtonProps } from "@eng-mohamedelsayed/admin-ui/components/ui/button";
import { Spinner } from "@eng-mohamedelsayed/admin-ui/components/ui/spinner";

export interface MutationSubmitButtonProps extends ButtonProps {
  isPending?: boolean;
  pendingText?: React.ReactNode;
  children?: React.ReactNode;
}

export function MutationSubmitButton({
  isPending = false,
  pendingText = "Saving...",
  children = "Save",
  disabled,
  type = "submit",
  ...props
}: MutationSubmitButtonProps) {
  return (
    <Button type={type} disabled={disabled || isPending} {...props}>
      {isPending ? (
        <>
          <Spinner />
          {pendingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
