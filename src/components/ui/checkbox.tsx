import * as React from "react";

import { cn } from "@/src/lib/utils";
import { formControlCheckboxClassName } from "@/src/styles/form-control-classes";

type CheckboxProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, type = "checkbox", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(formControlCheckboxClassName, className)}
      {...props}
    />
  ),
);

Checkbox.displayName = "Checkbox";
