import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/src/lib/utils";
import { formControlButtonClassName } from "@/src/styles/form-control-classes";

const buttonVariants = cva(
  cn(formControlButtonClassName, "cursor-pointer border"),
  {
    variants: {
      variant: {
        primary:
          "border-primary bg-primary text-[var(--oh-color-base)] hover:opacity-80",
        secondary:
          "border-[var(--oh-border)] bg-base-secondary text-white hover:bg-surface-raised",
        ghost:
          "border-[var(--oh-border)] bg-transparent text-foreground hover:bg-[var(--oh-interactive-active)]",
        danger:
          "border-[color:rgba(231,106,94,0.3)] bg-[color:rgba(231,106,94,0.12)] text-[var(--oh-color-danger)] hover:bg-[color:rgba(231,106,94,0.18)]",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  },
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant }), className)} {...props} />
  ),
);

Button.displayName = "Button";
