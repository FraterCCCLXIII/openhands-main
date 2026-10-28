import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { Bell, Newspaper, type LucideIcon } from "lucide-react";
import { useFeedConversations } from "#/hooks/use-feed-conversations";
import { I18nKey } from "#/i18n/declaration";
import { matchesFeedFilter } from "#/utils/feed-filters";
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
import { FeedColumns } from "./feed-columns";
import { useFeedFilterStore } from "#/stores/feed-filter-store";
import { FeedSortMenu } from "./feed-sort-menu";
import {
  DEFAULT_FEED_SORT,
  sortFeedConversations,
  type FeedSort,
} from "#/utils/feed-sort";

type FeedView = "feed" | "notifications";

const FEED_VIEWS: Array<{ view: FeedView; label: I18nKey; Icon: LucideIcon }> =
  [
    { view: "feed", label: I18nKey.FEED$TITLE, Icon: Newspaper },
    {
      view: "notifications",
      label: I18nKey.FEED$TAB_NOTIFICATIONS,
      Icon: Bell,
    },
  ];

// Same spring as the new chat page's mode toggle, so both pills feel alike.
const PILL_TRANSITION = {
  type: "spring",
  stiffness: 420,
  damping: 34,
  mass: 0.55,
} as const;

export function Feed() {
  const { t } = useTranslation("openhands");
  const reduceMotion = useReducedMotion();
  const disableAnimation = reduceMotion || import.meta.env.MODE === "test";
  const filter = useFeedFilterStore((state) => state.filter);
  const [view, setView] = useState<FeedView>("feed");
  const [sort, setSort] = useState<FeedSort>(DEFAULT_FEED_SORT);
  const stackByAgent = sort === "agent";
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
    const shown = sortFeedConversations(conversations, sort).filter(
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
  }, [conversations, filter, sort, pinnedIds, archivedIds]);

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
    <FeedColumns>
      <div className="mx-auto grid w-full max-w-[680px] shrink-0 grid-cols-[1fr_auto_1fr] items-center px-4 pt-4">
        <span aria-hidden />
        <LayoutGroup id="feed-view">
          <div
            role="tablist"
            data-testid="feed-tabs"
            className="inline-flex items-center rounded-full bg-[var(--oh-surface-raised)] p-1 text-sm font-medium"
          >
            {FEED_VIEWS.map(({ view: tabView, label, Icon }) => {
              const isActive = view === tabView;
              return (
                <button
                  key={tabView}
                  type="button"
                  role="tab"
                  data-testid={`feed-tab-${tabView}`}
                  aria-selected={isActive}
                  onClick={() => setView(tabView)}
                  className={cn(
                    "relative inline-flex items-center gap-2 rounded-full px-5 py-2",
                    "cursor-pointer transition-colors",
                    isActive
                      ? "text-contrast"
                      : "text-[var(--oh-muted)] hover:text-contrast",
                    disableAnimation &&
                      isActive &&
                      "bg-[var(--oh-interactive-hover)]",
                  )}
                >
                  {!disableAnimation && isActive ? (
                    <motion.span
                      layoutId="feed-view-pill"
                      className="absolute inset-0 rounded-full bg-[var(--oh-interactive-hover)]"
                      transition={PILL_TRANSITION}
                    />
                  ) : null}
                  <Icon
                    size={16}
                    aria-hidden
                    className="relative z-10 shrink-0"
                  />
                  <span className="relative z-10">{t(label)}</span>
                </button>
              );
            })}
          </div>
        </LayoutGroup>
        <FeedSortMenu
          sort={sort}
          onChange={setSort}
          className="justify-self-end"
        />
      </div>
      <div className="relative min-h-0 flex-1">
        <div
          aria-hidden
          data-testid="feed-fade-top"
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-8 bg-linear-to-b from-canvas-base to-transparent"
        />
        <div className="custom-scrollbar-always h-full overflow-y-auto px-4">
          <div className="mx-auto flex w-full max-w-[680px] flex-col gap-4 py-6">
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
          aria-hidden
          data-testid="feed-fade-bottom"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-12 bg-linear-to-t from-canvas-base to-transparent"
        />
      </div>
      <div data-testid="feed-composer-dock" className="shrink-0 px-4 pb-4 pt-2">
        <div className="mx-auto w-full max-w-[680px]">
          <FeedComposer />
        </div>
      </div>
    </FeedColumns>
  );
}
