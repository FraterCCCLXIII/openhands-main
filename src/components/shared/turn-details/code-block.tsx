import React from "react";
import { Check, Copy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import { cn } from "#/utils/utils";

/** Copies text, showing a check for a moment. */
export function CopyButton({ text }: { text: string }) {
  const { t } = useTranslation("openhands");
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  React.useEffect(() => () => clearTimeout(timer.current), []);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard access can be denied; there is nothing useful to show.
    }
  };
  const Icon = copied ? Check : Copy;
  return (
    <button
      type="button"
      data-testid="turn-details-copy"
      aria-label={t(I18nKey.BUTTON$COPY)}
      title={t(I18nKey.BUTTON$COPY)}
      onClick={copy}
      className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-md text-muted transition-colors hover:bg-interactive-hover hover:text-foreground"
    >
      <Icon className={cn("h-3 w-3", copied && "text-success")} />
    </button>
  );
}

/** Monospace, scrollable output. */
export function CodeBlock({
  children,
  maxHeight = "max-h-40",
}: {
  children: string;
  maxHeight?: string;
}) {
  return (
    <pre
      className={cn(
        "custom-scrollbar overflow-auto whitespace-pre-wrap break-words rounded-lg bg-surface-deep p-2 font-mono text-xs leading-relaxed text-foreground",
        maxHeight,
      )}
    >
      {children}
    </pre>
  );
}
