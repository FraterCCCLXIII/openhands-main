import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp } from "lucide-react";
import { I18nKey } from "#/i18n/declaration";

interface FeedStackProps {
  agentName: string;
  /** One rendered card per conversation, newest first. */
  cards: ReactNode[];
}

/**
 * Cards from the same agent as a stack: the newest on top with the rest
 * peeking out behind it, and a button that fans the stack out.
 */
export function FeedStack({ agentName, cards }: FeedStackProps) {
  const { t } = useTranslation("openhands");
  const [expanded, setExpanded] = useState(false);
  const [top, ...rest] = cards;

  if (rest.length === 0) return <>{top}</>;

  return (
    <div data-testid="feed-stack" data-expanded={expanded}>
      {expanded ? (
        <div className="flex flex-col gap-4">{cards}</div>
      ) : (
        <div className="relative pb-3">
          {rest.length > 1 ? (
            <div
              aria-hidden
              className="absolute inset-x-5 bottom-0 top-5 rounded-xl border border-border bg-surface-raised opacity-40"
            />
          ) : null}
          <div
            aria-hidden
            className="absolute inset-x-2.5 bottom-1.5 top-3 rounded-xl border border-border bg-surface-raised opacity-70"
          />
          <div className="relative">{top}</div>
        </div>
      )}
      <button
        type="button"
        data-testid="feed-stack-toggle"
        aria-expanded={expanded}
        onClick={() => setExpanded((value) => !value)}
        className="mx-auto mt-2 flex items-center gap-1 rounded-full bg-surface-raised px-3 py-1 text-xs text-muted hover:text-contrast"
      >
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {expanded
          ? t(I18nKey.FEED$STACK_COLLAPSE)
          : t(I18nKey.FEED$STACK_MORE, {
              count: rest.length,
              agent: agentName,
            })}
      </button>
    </div>
  );
}
