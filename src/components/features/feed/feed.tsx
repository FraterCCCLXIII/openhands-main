import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useFeedConversations } from "#/hooks/use-feed-conversations";
import { I18nKey } from "#/i18n/declaration";
import {
  ALL_FEED_FILTER,
  matchesFeedFilter,
  type FeedFilter,
} from "#/utils/feed-filters";
import type { AppConversation } from "#/api/conversation-service/agent-server-conversation-service.types";
import { useActiveBackend } from "#/contexts/active-backend-context";
import { useArchivedConversationsStore } from "#/stores/archived-conversations-store";
import { usePinnedConversationsStore } from "#/stores/pinned-conversations-store";
import { isEffectivelyArchivedConversation } from "#/utils/conversation-archive-status";
import { sortForNotifications } from "#/utils/feed-notifications";
import { cn } from "#/utils/utils";
import { getFeedAgent } from "#/utils/feed-agent";
import { isFeedDemoAgentsEnabled } from "#/utils/feed-demo-agents";
import { groupConsecutive } from "#/utils/feed-stacks";
import { FeedStack } from "./feed-stack";
import { FeedCard } from "./feed-card";
import { FeedNotificationCard } from "./feed-notification-card";
import { FeedComposer } from "./feed-composer";
import { FeedFilterSidebar } from "./feed-filter-sidebar";

type FeedView = "feed" | "notifications";

const FEED_VIEWS: Array<{ view: FeedView; label: I18nKey }> = [
  { view: "feed", label: I18nKey.FEED$TITLE },
  { view: "notifications", label: I18nKey.FEED$TAB_NOTIFICATIONS },
];

export function Feed() {
  const { t } = useTranslation("openhands");
  const [filter, setFilter] = useState<FeedFilter>(ALL_FEED_FILTER);
  const [view, setView] = useState<FeedView>("feed");
  const [stackByAgent, setStackByAgent] = useState(true);
  const {
    conversations,
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useFeedConversations();

  const { backend } = useActiveBackend();
  const pinnedIds = usePinnedConversationsStore(
    (state) => state.pinsByBackendId[backend.id],
  );
  const archivedIds = useArchivedConversationsStore(
    (state) => state.archivesByBackendId[backend.id],
  );

  // Archived conversations leave the feed; pinned ones lead it, each group
  // keeping the by-activity order the list already has.
  const visible = useMemo(() => {
    const pinned = new Set(pinnedIds);
    const archived = new Set(archivedIds);
    const shown = conversations.filter(
      (c) =>
        !isEffectivelyArchivedConversation(
          c.sandbox_status,
          archived.has(c.id),
        ) && matchesFeedFilter(c, filter),
    );
    return [
      ...shown.filter((c) => pinned.has(c.id)),
      ...shown.filter((c) => !pinned.has(c.id)),
    ];
  }, [conversations, filter, pinnedIds, archivedIds]);

  let body;
  if (isLoading) {
    body = null;
  } else if (isError) {
    body = <p className="text-sm text-muted">{t(I18nKey.FEED$LOAD_ERROR)}</p>;
  } else if (conversations.length === 0) {
    body = (
      <p data-testid="feed-empty" className="text-sm text-muted">
        {t(I18nKey.FEED$EMPTY)}
      </p>
    );
  } else if (visible.length === 0) {
    body = (
      <p data-testid="feed-no-matches" className="text-sm text-muted">
        {t(I18nKey.FEED$NO_MATCHES)}
      </p>
    );
  } else {
    const ordered = view === "feed" ? visible : sortForNotifications(visible);
    const demo = isFeedDemoAgentsEnabled(window.location.search);
    const renderCard = (conversation: AppConversation) =>
      view === "feed" ? (
        <FeedCard key={conversation.id} conversation={conversation} />
      ) : (
        <FeedNotificationCard
          key={conversation.id}
          conversation={conversation}
        />
      );
    body = stackByAgent
      ? groupConsecutive(ordered, (conversation) => {
          const { name } = getFeedAgent(conversation, demo);
          return `${name}:${conversation.launched_agent_profile?.agent_profile_id ?? ""}`;
        }).map((group) => (
          <FeedStack
            key={group.items[0].id}
            agentName={getFeedAgent(group.items[0], demo).name}
            cards={group.items.map(renderCard)}
          />
        ))
      : ordered.map(renderCard);
  }

  return (
    <div className="flex h-full min-h-0 flex-col md:flex-row">
      <aside className="custom-scrollbar-always w-full shrink-0 overflow-y-auto border-border px-2 py-6 max-md:max-h-40 md:w-60 md:border-r">
        <FeedFilterSidebar
          conversations={conversations}
          filter={filter}
          onChange={setFilter}
        />
      </aside>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div
          role="tablist"
          data-testid="feed-tabs"
          className="mx-auto flex w-full max-w-2xl shrink-0 gap-1 px-4 pt-4"
        >
          {FEED_VIEWS.map(({ view: tabView, label }) => (
            <button
              key={tabView}
              type="button"
              role="tab"
              data-testid={`feed-tab-${tabView}`}
              aria-selected={view === tabView}
              onClick={() => setView(tabView)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm",
                view === tabView
                  ? "bg-surface-raised font-medium text-contrast"
                  : "text-muted hover:text-contrast",
              )}
            >
              {t(label)}
            </button>
          ))}
          <button
            type="button"
            data-testid="feed-stack-by-agent"
            aria-pressed={stackByAgent}
            onClick={() => setStackByAgent((value) => !value)}
            className={cn(
              "ml-auto rounded-full px-3 py-1.5 text-xs",
              stackByAgent
                ? "bg-surface-raised text-contrast"
                : "text-muted hover:text-contrast",
            )}
          >
            {t(I18nKey.FEED$GROUP_BY_AGENT)}
          </button>
        </div>
        <div className="custom-scrollbar-always min-h-0 flex-1 overflow-y-auto px-4">
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 py-6">
            <h1 className="sr-only">{t(I18nKey.FEED$TITLE)}</h1>
            <section
              data-testid="feed"
              className={cn(
                "flex flex-col",
                view === "feed" ? "gap-4" : "gap-2",
              )}
            >
              {body}
            </section>
            {hasNextPage ? (
              <button
                type="button"
                data-testid="feed-load-more"
                disabled={isFetchingNextPage}
                onClick={() => fetchNextPage()}
                className="self-center text-sm text-muted hover:text-contrast disabled:opacity-50"
              >
                {t(I18nKey.FEED$LOAD_MORE)}
              </button>
            ) : null}
          </div>
        </div>
        <div
          data-testid="feed-composer-dock"
          className="shrink-0 px-4 pb-4 pt-2"
        >
          <div className="mx-auto w-full max-w-2xl">
            <FeedComposer />
          </div>
        </div>
      </div>
    </div>
  );
}
