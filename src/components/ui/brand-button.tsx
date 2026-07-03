import { forwardRef } from "react";

import { cn } from "@/src/lib/utils";
import { formControlButtonClassName } from "@/src/styles/form-control-classes";

interface BrandButtonProps {
  variant: "primary" | "secondary" | "outline-accent";
  type?: React.ButtonHTMLAttributes<HTMLButtonElement>["type"];
  isDisabled?: boolean;
  className?: string;
  onClick?: () => void;
  children: React.ReactNode;
}

export const BrandButton = forwardRef<HTMLButtonElement, BrandButtonProps>(
  function BrandButton(
    {
      variant,
      type = "button",
      isDisabled,
      className,
      onClick,
      children,
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        onClick={onClick}
        className={cn(
          formControlButtonClassName,
          variant === "primary" &&
            "bg-primary text-[var(--oh-color-base)] hover:opacity-80",
          variant === "secondary" &&
            "border border-[var(--oh-border)] bg-base-secondary text-white hover:bg-surface-raised",
          variant === "outline-accent" &&
            "w-full border border-[var(--oh-accent)] bg-transparent text-[var(--oh-accent)] hover:bg-white/[0.08]",
          className,
        )}
      >
        {children}
      </button>
    );
  },
);
