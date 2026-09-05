import * as React from "react";

export interface FormFieldPresentationProps {
  label?: React.ReactNode | undefined;
  description?: React.ReactNode | undefined;
  required?: boolean | undefined;
  className?: string | undefined;
}
