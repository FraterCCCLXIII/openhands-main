import { cn } from "@/src/lib/utils";
import { formControlSettingsFieldClassName } from "@/src/styles/form-control-classes";

interface SettingsSelectOption {
  value: string;
  label: string;
}

interface SettingsSelectProps {
  testId?: string;
  name?: string;
  label: string;
  value: string;
  options: SettingsSelectOption[];
  className?: string;
  onChange: (value: string) => void;
}

export function SettingsSelect({
  testId,
  name,
  label,
  value,
  options,
  className,
  onChange,
}: SettingsSelectProps) {
  return (
    <label className={cn("flex w-full min-w-0 flex-col gap-2.5", className)}>
      <span className="text-sm">{label}</span>
      <select
        data-testid={testId}
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(formControlSettingsFieldClassName, "cursor-pointer")}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
