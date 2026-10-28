import React from "react";
import { cn } from "#/utils/utils";

/** Time each message stays on screen before the next one rolls in. */
const ROTATE_INTERVAL_MS = 2400;

/**
 * Live status line that cycles through already-translated messages. Each new
 * message rolls in from below, so the change reads as motion rather than a
 * text swap. Callers pass translated strings; this component only rotates them.
 */
export function RotatingStatus({
  messages,
  className,
}: {
  messages: string[];
  className?: string;
}) {
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    if (messages.length < 2) return undefined;
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, ROTATE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [messages.length]);

  const current = messages[index % Math.max(messages.length, 1)] ?? "";

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="rotating-status"
      className={cn(
        "flex items-center gap-2 overflow-hidden text-xs text-muted",
        className,
      )}
    >
      <span
        key={index}
        className="animate-[status-roll-in_320ms_ease-out_both] motion-reduce:animate-none"
      >
        {current}
      </span>
    </div>
  );
}
