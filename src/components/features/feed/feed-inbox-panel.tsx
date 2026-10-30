import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { NavigationLink } from "#/components/shared/navigation-link";
import { useBackendScopedPath } from "#/hooks/use-backend-scoped-path";
import { useFeedFactories } from "#/hooks/use-feed-factories";
import { useResolveTaskPlacements } from "#/hooks/use-resolve-task-placements";
import { feedConversationPath } from "#/hooks/use-open-feed-conversation";
import { I18nKey } from "#/i18n/declaration";
import {
  useFactoryInboxStore,
  type FactoryInboxItem,
} from "#/stores/factory-inbox-store";
import { isTaskConversationId } from "#/utils/factory-placement";
import type { FeedFilter } from "#/utils/feed-filters";
import { formatRelativeTime } from "#/utils/format-relative-time";
import { cn } from "#/utils/utils";

interface FeedInboxPanelProps {
  /** Whether the section is open; a collapsed inbox is not "viewed". */
  visible: boolean;
  filter: FeedFilter;
  onChange: (filter: FeedFilter) => void;
}

const CHIP =
  "rounded-full px-2.5 py-1 text-xs transition-colors focus-visible:outline focus-visible:outline-2";

/**
 * What has been sent to factory inboxes, newest first, for the factory picked
 * in the Tower filter. Viewing it marks the log as seen, which clears the
 * badge on its tab. A request whose Cloud sandbox is still provisioning shows
 * "Starting…" until its real conversation id is known.
 */
export function FeedInboxPanel({
  filter,
  onChange,
  visible,
}: FeedInboxPanelProps) {
  const { t, i18n } = useTranslation("openhands");
  const factories = useFeedFactories();
  const backendScopedPath = useBackendScopedPath();
  const items = useFactoryInboxStore((state) => state.items);
  const lastSeenAt = useFactoryInboxStore((state) => state.lastSeenAt);
  const markSeen = useFactoryInboxStore((state) => state.markSeen);
  // Resolves temporary task ids in the log to real conversation ids.
  useResolveTaskPlacements();

  const newest = items.at(-1)?.createdAt ?? null;
  useEffect(() => {
    if (visible && newest && (!lastSeenAt || newest > lastSeenAt)) markSeen();
  }, [visible, newest, lastSeenAt, markSeen]);

  const rows = useMemo(
    () =>
      items
        .filter(
          (item) => !filter.factoryId || item.factoryId === filter.factoryId,
        )
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [items, filter.factoryId],
  );
  const factoryName = (id: string) =>
    factories.find((f) => f.id === id)?.name ?? id;

  const status = (item: FactoryInboxItem) => {
    if (item.status === "failed") return t(I18nKey.FEED$INBOX_FAILED);
    if (item.conversationId && isTaskConversationId(item.conversationId)) {
      return t(I18nKey.FEED$INBOX_STARTING);
    }
    return t(I18nKey.FEED$INBOX_SENT);
  };

  return (
    <section data-testid="feed-inbox" aria-label={t(I18nKey.FEED$INBOX)}>
      {factories.length > 0 ? (
        <div
          data-testid="feed-inbox-factories"
          className="mb-2 flex flex-wrap gap-1 px-2"
        >
          {[null, ...factories.map((f) => f.id)].map((id) => {
            const selected = filter.factoryId === id;
            return (
              <button
                key={id ?? "all"}
                type="button"
                data-testid="feed-inbox-factory-chip"
                aria-pressed={selected}
                onClick={() => onChange({ ...filter, factoryId: id })}
                className={cn(
                  CHIP,
                  selected
                    ? "bg-[var(--oh-interactive-hover)] text-contrast"
                    : "bg-surface text-muted hover:text-contrast",
                )}
              >
                {id ? factoryName(id) : t(I18nKey.FEED$ALL)}
              </button>
            );
          })}
        </div>
      ) : null}
      {rows.length === 0 ? (
        <p
          data-testid="feed-inbox-empty"
          className="px-2 pt-1 text-sm text-muted"
        >
          {t(I18nKey.FEED$INBOX_EMPTY)}
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {rows.map((item) => {
            const starting =
              !!item.conversationId &&
              isTaskConversationId(item.conversationId);
            const canOpen =
              item.status === "sent" && !!item.conversationId && !starting;
            return (
              <li
                key={item.id}
                data-testid="feed-inbox-item"
                className="rounded-lg border border-border bg-surface-raised px-3 py-2"
              >
                <p className="line-clamp-2 break-words text-sm text-contrast">
                  {item.text}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                  <span
                    data-testid="feed-inbox-item-factory"
                    className="rounded-full bg-surface px-2 py-0.5"
                  >
                    {factoryName(item.factoryId)}
                  </span>
                  <span data-testid="feed-inbox-item-agent">
                    {t(I18nKey.FEED$INBOX_ASSIGNED_TO, {
                      agent: item.agentName,
                    })}
                  </span>
                  <span>
                    {formatRelativeTime(item.createdAt, i18n.language, t)}
                  </span>
                  <span
                    data-testid="feed-inbox-item-status"
                    className={cn(
                      "rounded-full px-2 py-0.5",
                      item.status === "failed"
                        ? "bg-danger-soft text-danger-soft-foreground"
                        : "bg-surface",
                    )}
                  >
                    {status(item)}
                  </span>
                  {canOpen ? (
                    <NavigationLink
                      to={backendScopedPath(
                        feedConversationPath(item.conversationId as string),
                      )}
                      data-testid="feed-inbox-item-open"
                      className="ml-auto font-medium text-contrast hover:underline"
                    >
                      {t(I18nKey.FEED$OPEN_SHORT)}
                    </NavigationLink>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
