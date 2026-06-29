import { Search, X } from "lucide-react";

import { INTEGRATIONS_PAGE_COPY } from "@/src/constants/integrations-page";
import { cn } from "@/src/lib/utils";

interface IntegrationsSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  ariaLabel?: string;
  testId?: string;
}

export function IntegrationsSearchInput({
  value,
  onChange,
  className,
  placeholder = INTEGRATIONS_PAGE_COPY.searchPlaceholder,
  ariaLabel = INTEGRATIONS_PAGE_COPY.searchPlaceholder,
  testId = "integrations-search",
}: IntegrationsSearchInputProps) {
  return (
    <div
      data-testid={testId}
      className={cn(
        "relative flex min-w-0 flex-1 items-center",
        "h-9 rounded-lg border border-[var(--oh-border)] bg-base-secondary",
        "transition-colors focus-within:border-white/40 focus-within:ring-1 focus-within:ring-white/20",
        className,
      )}
    >
      <Search className="ml-3 size-4 shrink-0 text-tertiary-alt" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        data-testid="integrations-search-input"
        className="min-w-0 flex-1 border-0 bg-transparent px-3 text-sm text-white outline-none placeholder:text-tertiary-alt [&::-webkit-search-cancel-button]:hidden"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label={INTEGRATIONS_PAGE_COPY.searchClearAriaLabel}
          data-testid="integrations-search-clear"
          className="mr-2 cursor-pointer rounded p-1 text-tertiary-alt hover:text-content"
        >
          <X className="size-4" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
