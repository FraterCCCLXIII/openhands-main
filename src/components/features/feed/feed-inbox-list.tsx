import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { NavigationLink } from "#/components/shared/navigation-link";
import { useBackendScopedPath } from "#/hooks/use-backend-scoped-path";
import { useFeedFactories } from "#/hooks/use-feed-factories";
import { feedConversationPath } from "#/hooks/use-open-feed-conversation";
import { useResolveTaskPlacements } from "#/hooks/use-resolve-task-placements";
import { I18nKey } from "#/i18n/declaration";
import {
  countUnseenInboxItems,
  isUnseenInboxItem,
  useFactoryInboxStore,
  type FactoryInboxItem,
} from "#/stores/factory-inbox-store";
import { isTaskConversationId } from "#/utils/factory-placement";
import { formatRelativeTime } from "#/utils/format-relative-time";
import { cn } from "#/utils/utils";
import { FeedFactoryChip } from "./feed-factory-chip";

type InboxFilter = "all" | "unseen" | "failed";

const FILTERS: Array<{ key: InboxFilter; label: I18nKey }> = [
  { key: "all", label: I18nKey.FEED$ALL },
  { key: "unseen", label: I18nKey.FEED$INBOX_FILTER_UNSEEN },
  { key: "failed", label: I18nKey.FEED$INBOX_FILTER_FAILED },
];

const CHIP =
  "rounded-full px-2.5 py-1 text-xs transition-colors focus-visible:outline focus-visible:outline-2";

interface FeedInboxListProps {
  /** The factory whose inbox this is; null lists every factory's inbox. */
  factoryId: string | null;
}

/**
 * What has been sent to factory inboxes, newest first: every factory's, or one
 * factory's. The same list backs Tower's Inbox tab and a factory page's
 * Incoming tab. "Mark all as seen" is the only way entries leave "Unseen", so
 * the badges only clear when someone with the inbox open says so. A request
 * whose Cloud sandbox is still provisioning shows "Starting…" until its real
 * conversation id is known.
 */
export function FeedInboxList({ factoryId }: FeedInboxListProps) {
  const { t, i18n } = useTranslation("openhands");
  const factories = useFeedFactories();
  const backendScopedPath = useBackendScopedPath();
  const items = useFactoryInboxStore((state) => state.items);
  const lastSeenAt = useFactoryInboxStore((state) => state.lastSeenAt);
  const seenByFactory = useFactoryInboxStore((state) => state.seenByFactory);
  const markSeen = useFactoryInboxStore((state) => state.markSeen);
  const [filter, setFilter] = useState<InboxFilter>("all");
  const [query, setQuery] = useState("");
  // Resolves temporary task ids in the log to real conversation ids.
  useResolveTaskPlacements();

  const markers = useMemo(
    () => ({ lastSeenAt, seenByFactory }),
    [lastSeenAt, seenByFactory],
  );
  const factoryById = useMemo(
    () => new Map(factories.map((factory) => [factory.id, factory])),
    [factories],
  );
  const inScope = useMemo(
    () =>
      items
        .filter((item) => !factoryId || item.factoryId === factoryId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [items, factoryId],
  );
  const unseen = countUnseenInboxItems(items, markers, factoryId);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return inScope.filter((item) => {
      if (filter === "unseen" && !isUnseenInboxItem(item, markers)) {
        return false;
      }
      if (filter === "failed" && item.status !== "failed") return false;
      if (!needle) return true;
      const haystack = [
        item.text,
        item.agentName,
        factoryById.get(item.factoryId)?.name ?? item.factoryId,
      ];
      return haystack.some((value) => value.toLowerCase().includes(needle));
    });
  }, [inScope, filter, query, markers, factoryById]);

  const statusLabel = (item: FactoryInboxItem) => {
    if (item.status === "failed") return t(I18nKey.FEED$INBOX_FAILED);
    if (
      item.status === "sending" ||
      (item.conversationId && isTaskConversationId(item.conversationId))
    ) {
      return t(I18nKey.FEED$INBOX_STARTING);
    }
    return t(I18nKey.FEED$INBOX_SENT);
  };

  return (
    <section
      data-testid="feed-inbox"
      aria-label={t(I18nKey.FEED$INBOX)}
      className="flex flex-col gap-3"
    >
      <div className="flex flex-wrap items-center gap-2">
        <div
          role="group"
          aria-label={t(I18nKey.FEED$INBOX)}
          className="flex flex-wrap gap-1"
        >
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              data-testid={`feed-inbox-filter-${key}`}
              aria-pressed={filter === key}
              onClick={() => setFilter(key)}
              className={cn(
                CHIP,
                filter === key
                  ? "bg-[var(--oh-interactive-hover)] text-contrast"
                  : "bg-surface text-muted hover:text-contrast",
              )}
            >
              {t(label)}
            </button>
          ))}
        </div>
        <button
          type="button"
          data-testid="feed-inbox-mark-seen"
          disabled={unseen === 0}
          onClick={() => markSeen(factoryId)}
          className={cn(
            CHIP,
            "ml-auto bg-surface text-contrast hover:bg-surface-raised disabled:opacity-50",
          )}
        >
          {t(I18nKey.FEED$INBOX_MARK_ALL_SEEN)}
        </button>
      </div>
      <input
        type="search"
        data-testid="feed-inbox-search"
        aria-label={t(I18nKey.FEED$INBOX_SEARCH)}
        placeholder={t(I18nKey.FEED$INBOX_SEARCH)}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-contrast placeholder:text-muted focus-visible:outline focus-visible:outline-2"
      />
      {inScope.length === 0 ? (
        <p data-testid="feed-inbox-empty" className="text-sm text-muted">
          {t(I18nKey.FEED$INBOX_EMPTY)}
        </p>
      ) : rows.length === 0 ? (
        <p data-testid="feed-inbox-no-matches" className="text-sm text-muted">
          {t(I18nKey.FEED$INBOX_NO_MATCHES)}
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {rows.map((item) => {
            const starting =
              !!item.conversationId &&
              isTaskConversationId(item.conversationId);
            const canOpen =
              item.status === "sent" && !!item.conversationId && !starting;
            const factory = factoryById.get(item.factoryId);
            const isUnseen = isUnseenInboxItem(item, markers);
            return (
              <li
                key={item.id}
                data-testid="feed-inbox-item"
                data-unseen={isUnseen}
                className="rounded-lg border border-border bg-surface-raised px-3 py-2"
              >
                <p className="line-clamp-2 break-words text-sm text-contrast">
                  {item.text}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                  {factoryId ? null : factory ? (
                    <FeedFactoryChip
                      factory={factory}
                      testId="feed-inbox-item-factory"
                    />
                  ) : (
                    <span
                      data-testid="feed-inbox-item-factory"
                      className="rounded-full bg-surface px-2 py-0.5"
                    >
                      {item.factoryId}
                    </span>
                  )}
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
                    {statusLabel(item)}
                  </span>
                  {isUnseen ? (
                    <span
                      data-testid="feed-inbox-item-unseen"
                      className="rounded-full bg-[var(--oh-interactive-hover)] px-2 py-0.5 text-contrast"
                    >
                      {t(I18nKey.FEED$INBOX_FILTER_UNSEEN)}
                    </span>
                  ) : null}
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
