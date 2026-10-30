import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, Loader2, X } from "lucide-react";
import { I18nKey } from "#/i18n/declaration";
import { useFeedFactories } from "#/hooks/use-feed-factories";
import type { PendingFeedItem } from "#/stores/feed-pending-store";
import { FeedAgentAvatar } from "./feed-agent-avatar";

// A Cloud sandbox can take a while to provision; past this the card says so.
export const PENDING_SLOW_MS = 120_000;

interface FeedPendingCardProps {
  item: PendingFeedItem;
  onDismiss: (id: string) => void;
}

/**
 * The optimistic card for a conversation that is still starting: the message
 * the user sent, the agent it went to and a "Starting…" state. It stays until
 * the real conversation appears in the list (the feed then drops it), or until
 * the user dismisses it after it fails or takes too long.
 */
export function FeedPendingCard({ item, onDismiss }: FeedPendingCardProps) {
  const { t } = useTranslation("openhands");
  const factories = useFeedFactories();
  const factory = factories.find((f) => f.id === item.factoryId);
  const [slow, setSlow] = useState(
    () => Date.now() - item.createdAt > PENDING_SLOW_MS,
  );

  useEffect(() => {
    if (slow) return undefined;
    const timer = setTimeout(
      () => setSlow(true),
      Math.max(0, item.createdAt + PENDING_SLOW_MS - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [slow, item.createdAt]);

  const failed = item.status === "failed";
  let statusText = t(I18nKey.FEED$INBOX_STARTING);
  if (failed) statusText = t(I18nKey.FEED$PENDING_FAILED);
  else if (slow) statusText = t(I18nKey.FEED$PENDING_SLOW);

  return (
    <article
      tabIndex={-1}
      data-testid="feed-pending-card"
      data-pending-id={item.id}
      aria-busy={!failed}
      className="rounded-lg border border-border bg-surface-raised outline-none focus-visible:ring-2 focus-visible:ring-[var(--oh-interactive-hover)]"
    >
      <header className="flex items-center gap-3 px-4 pt-3">
        <FeedAgentAvatar
          agent={{ name: item.agentName, icon: "openhands" }}
          size={40}
        />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-2 text-sm font-semibold text-contrast">
            <span data-testid="feed-pending-agent" className="truncate">
              {item.agentName}
            </span>
            {factory ? (
              <span
                data-testid="feed-pending-factory"
                className="rounded-full bg-surface px-2 py-0.5 text-xs font-normal text-muted"
              >
                {factory.name}
              </span>
            ) : null}
          </p>
          <p
            role="status"
            data-testid="feed-pending-status"
            className="flex items-center gap-1.5 text-xs text-muted"
          >
            {failed ? (
              <AlertCircle size={12} aria-hidden className="text-danger" />
            ) : (
              <Loader2
                size={12}
                aria-hidden
                className="animate-spin motion-reduce:animate-none"
              />
            )}
            <span>{statusText}</span>
          </p>
        </div>
        {failed || slow ? (
          <button
            type="button"
            data-testid="feed-pending-dismiss"
            aria-label={t(I18nKey.FEED$PENDING_DISMISS)}
            title={t(I18nKey.FEED$PENDING_DISMISS)}
            onClick={() => onDismiss(item.id)}
            className="rounded-full p-2 text-muted hover:bg-surface hover:text-contrast"
          >
            <X size={16} aria-hidden />
          </button>
        ) : null}
      </header>
      <p
        data-testid="feed-pending-text"
        className="line-clamp-4 break-words px-4 pb-4 pt-3 text-base text-contrast"
      >
        {item.text}
      </p>
    </article>
  );
}
