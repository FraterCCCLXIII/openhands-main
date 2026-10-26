import React from "react";
import { CopyToClipboardButton } from "#/components/shared/buttons/copy-to-clipboard-button";
import { cn } from "#/utils/utils";

interface CopyableCommandFieldProps {
  /** The command text to display and copy. */
  value: string;
  /** Label shown above the field. */
  label: string;
  /** Optional test ID for the container. */
  testId?: string;
  /** Additional classes for the outer container. */
  className?: string;
}

/**
 * A read-only field that displays a command with a copy button.
 * Styled to match SettingsInput but with copy functionality.
 */
export function CopyableCommandField({
  value,
  label,
  testId,
  className,
}: CopyableCommandFieldProps) {
  const [isCopied, setIsCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setIsCopied(true);
    } catch {
      // Clipboard unavailable; the command remains selectable.
    }
  };

  React.useEffect(() => {
    if (isCopied) {
      const timeout = setTimeout(() => setIsCopied(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [isCopied]);

  return (
    <div
      data-testid={testId}
      className={cn("flex flex-col gap-2.5 w-full min-w-0", className)}
    >
      <span className="text-sm">{label}</span>
      <div
        className={cn(
          "flex items-center gap-2 w-full min-w-0",
          "rounded-lg border border-border-subtle bg-surface-raised",
          "px-3 py-2",
        )}
      >
        <code
          data-testid={testId ? `${testId}-value` : undefined}
          className="flex-1 min-w-0 text-sm text-tertiary-alt font-mono truncate select-all"
        >
          {value}
        </code>
        <CopyToClipboardButton
          isHidden={false}
          isDisabled={isCopied}
          onClick={handleCopy}
          mode={isCopied ? "copied" : "copy"}
          variant="ghost"
        />
      </div>
    </div>
  );
}
