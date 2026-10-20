import { ActionEvent } from "#/types/agent-server/core";
import { cn } from "#/utils/utils";

/**
 * The agent's reasoning while its turn is still live, shown as quiet scratch
 * text rather than a full chat bubble. Mounted only while the thought is the
 * tail of the chat; once the next item lands it renders as a normal
 * `ThoughtEventMessage`, so the scratch never settles into the transcript.
 */
export function ThoughtScratch({
  event,
  className,
}: {
  event: ActionEvent;
  className?: string;
}) {
  const text = event.thought
    .filter((t) => t.type === "text")
    .map((t) => t.text)
    .join("\n")
    .trim();

  if (!text) return null;

  return (
    <div
      data-testid="thought-scratch"
      className={cn(
        "rounded-lg border border-border/70 bg-surface/40 px-3 py-2.5 font-sans text-xs leading-relaxed text-muted",
        className,
      )}
    >
      <p className="m-0 whitespace-pre-wrap break-words">{text}</p>
    </div>
  );
}
