import { cn } from "@/src/lib/utils";
import { formControlTransitionClassName } from "@/src/styles/form-control-classes";

interface SettingsTabOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface SettingsTabListProps<T extends string> {
  value: T;
  options: SettingsTabOption<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
  testId?: string;
  className?: string;
}

function settingsTabButtonClassName(isActive: boolean) {
  return cn(
    "inline-flex w-fit cursor-pointer items-center rounded-none bg-transparent px-2 py-2 text-sm capitalize",
    formControlTransitionClassName,
    "border-b-2 pb-2",
    isActive
      ? "border-white text-white"
      : "border-transparent text-[var(--oh-muted)] hover:text-white",
  );
}

export function TabCountBadge({ count }: { count: number }) {
  return (
    <span className="ml-2 inline-flex items-center justify-center rounded-full bg-surface-raised px-2 py-0.5 text-xs text-foreground">
      {count}
    </span>
  );
}

export function SettingsTabList<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  testId,
  className,
}: SettingsTabListProps<T>) {
  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
      aria-label={ariaLabel}
      data-testid={testId}
      className={cn("flex items-center gap-2", className)}
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            data-testid={testId ? `${testId}-${option.value}` : undefined}
            className={settingsTabButtonClassName(isActive)}
            onClick={() => onChange(option.value)}
          >
            {option.label}
            {option.count !== undefined ? (
              <TabCountBadge count={option.count} />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
