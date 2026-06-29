import { SelectDropdown } from "@/src/components/ui/select-dropdown";
import { cn } from "@/src/lib/utils";

interface SettingsSelectOption {
  value: string;
  label: string;
}

type SettingsSelectLabelLayout = "stacked" | "inline";

interface SettingsSelectProps {
  testId?: string;
  name?: string;
  label: string;
  value: string;
  options: SettingsSelectOption[];
  className?: string;
  labelLayout?: SettingsSelectLabelLayout;
  onChange: (value: string) => void;
}

export function SettingsSelect({
  testId,
  name,
  label,
  value,
  options,
  className,
  labelLayout = "stacked",
  onChange,
}: SettingsSelectProps) {
  const isInlineLabel = labelLayout === "inline";

  return (
    <label
      className={cn(
        "flex min-w-0",
        isInlineLabel
          ? "w-auto shrink-0 flex-row items-center gap-3"
          : "w-full flex-col gap-2.5",
        className,
      )}
    >
      <span
        className={cn(
          "text-sm",
          isInlineLabel && "shrink-0 whitespace-nowrap",
        )}
      >
        {label}
      </span>
      <SelectDropdown
        testId={testId}
        name={name}
        value={value}
        options={options}
        ariaLabel={label}
        onChange={onChange}
        className={isInlineLabel ? "w-52 max-w-full min-w-[10rem]" : undefined}
        triggerClassName="placeholder:italic"
      />
    </label>
  );
}
