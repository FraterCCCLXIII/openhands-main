"use client";

import { SelectDropdown } from "@/src/components/ui/select-dropdown";
import { cn } from "@/src/lib/utils";

interface EnumFilterDropdownProps<T extends string> {
  testId: string;
  triggerTestId?: string;
  value: T;
  onChange: (value: T) => void;
  options: readonly T[];
  labelByValue: Record<T, string>;
  ariaLabel: string;
  className?: string;
  triggerClassName?: string;
  defaultValue?: T;
  highlightWhenNotDefault?: boolean;
}

export function EnumFilterDropdown<T extends string>({
  testId,
  triggerTestId,
  value,
  onChange,
  options,
  labelByValue,
  ariaLabel,
  className,
  triggerClassName,
  defaultValue,
  highlightWhenNotDefault = true,
}: EnumFilterDropdownProps<T>) {
  return (
    <SelectDropdown
      testId={testId}
      triggerTestId={triggerTestId ?? `${testId}-trigger`}
      value={value}
      onChange={(nextValue) => onChange(nextValue as T)}
      options={options.map((option) => ({
        value: option,
        label: labelByValue[option],
      }))}
      ariaLabel={ariaLabel}
      variant="filter"
      className={cn("shrink-0", className)}
      triggerClassName={triggerClassName}
      menuAlign="right"
      highlightWhenNotDefault={highlightWhenNotDefault}
      defaultValue={defaultValue ?? options[0]}
    />
  );
}
