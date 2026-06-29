import { SelectDropdown } from "@/src/components/ui/select-dropdown";
import { cn } from "@/src/lib/utils";

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
      <SelectDropdown
        testId={testId}
        name={name}
        value={value}
        options={options}
        ariaLabel={label}
        onChange={onChange}
        triggerClassName="placeholder:italic"
      />
    </label>
  );
}
