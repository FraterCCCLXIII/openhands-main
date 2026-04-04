import { cn } from "@/src/lib/utils";
import type { FunctionAccessMode, FunctionSpec } from "@/src/types/context-layer";

export const accessModeLabel = (mode: FunctionAccessMode) => {
  switch (mode) {
    case "enabled":
      return "Enabled";
    case "disabled":
      return "Disabled";
    case "approval_required":
      return "Case-by-case";
  }
};

export const getFunctionAccessMode = (
  functionSpec: FunctionSpec,
): FunctionAccessMode =>
  functionSpec.accessMode ?? (functionSpec.enabled ? "enabled" : "disabled");

export const matchesFunctionSearch = (
  name: string,
  functionSpec: FunctionSpec,
  query: string,
) => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  return [
    name,
    functionSpec.description,
    functionSpec.defaultScopes.join(" "),
  ]
    .filter((value): value is string => Boolean(value))
    .some((value) => value.toLowerCase().includes(normalizedQuery));
};

export const accessModeButtonClassName: Record<FunctionAccessMode, string> = {
  enabled:
    "border-[color:rgba(165,231,94,0.3)] bg-[color:rgba(165,231,94,0.12)] text-[var(--color-success)] hover:bg-[color:rgba(165,231,94,0.18)]",
  approval_required:
    "border-[color:rgba(217,181,90,0.28)] bg-[color:rgba(217,181,90,0.12)] text-[var(--color-warning)] hover:bg-[color:rgba(217,181,90,0.18)]",
  disabled:
    "border-[color:rgba(231,106,94,0.3)] bg-[color:rgba(231,106,94,0.12)] text-[var(--color-danger)] hover:bg-[color:rgba(231,106,94,0.18)]",
};

const accessModeSegmentClassName: Record<FunctionAccessMode, string> = {
  enabled: "bg-[color:rgba(165,231,94,0.16)] text-[var(--color-success)]",
  approval_required:
    "bg-[color:rgba(217,181,90,0.16)] text-[var(--color-warning)]",
  disabled: "bg-[color:rgba(231,106,94,0.16)] text-[var(--color-danger)]",
};

const accessModeOptions: Array<{
  value: FunctionAccessMode;
  label: string;
}> = [
  { value: "enabled", label: "Enabled" },
  { value: "approval_required", label: "Case-by-case" },
  { value: "disabled", label: "Disabled" },
];

export const AccessModeSlider = ({
  functionName,
  mode,
  onChange,
}: {
  functionName: string;
  mode: FunctionAccessMode;
  onChange: (mode: FunctionAccessMode) => void;
}) => (
  <div
    className="inline-flex flex-wrap items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-input)] p-1"
    role="group"
    aria-label={`Default access for ${functionName}`}
    data-access-mode={mode}
  >
    {accessModeOptions.map((option) => {
      const active = option.value === mode;
      return (
        <button
          key={option.value}
          type="button"
          className={cn(
            "cursor-pointer rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors",
            active
              ? accessModeSegmentClassName[option.value]
              : "text-[var(--color-text-base)] hover:bg-[var(--color-bg-active)] hover:text-white",
          )}
          aria-pressed={active}
          aria-label={`${accessModeLabel(option.value)} access for ${functionName}`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      );
    })}
  </div>
);
