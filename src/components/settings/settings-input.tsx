import { forwardRef } from "react";

import { cn } from "@/src/lib/utils";
import { formControlSettingsFieldClassName } from "@/src/styles/form-control-classes";

interface SettingsInputProps {
  testId?: string;
  name?: string;
  label: string;
  type?: React.HTMLInputTypeAttribute;
  value?: string;
  placeholder?: string;
  maxLength?: number;
  className?: string;
  isDisabled?: boolean;
  onChange?: (value: string) => void;
}

export const SettingsInput = forwardRef<HTMLInputElement, SettingsInputProps>(
  function SettingsInput(
    {
      testId,
      name,
      label,
      type = "text",
      value,
      placeholder,
      maxLength,
      className,
      isDisabled = false,
      onChange,
    },
    ref,
  ) {
    return (
      <label className={cn("flex w-full min-w-0 flex-col gap-2.5", className)}>
        <span className="text-sm">{label}</span>
        <input
          ref={ref}
          data-testid={testId}
          name={name}
          type={type}
          value={value}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={isDisabled}
          readOnly={isDisabled}
          onChange={(event) => onChange?.(event.target.value)}
          className={cn(
            formControlSettingsFieldClassName,
            "disabled:bg-[var(--oh-surface-raised)] disabled:border-[var(--oh-border-subtle)]",
          )}
        />
      </label>
    );
  },
);
