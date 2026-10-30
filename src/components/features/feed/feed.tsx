import {
  Suspense,
  lazy,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
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
import { useOpenFeedConversation } from "#/hooks/use-open-feed-conversation";
import { FeedStack } from "./feed-stack";
import { FeedCard } from "./feed-card";
import { FeedNotificationCard } from "./feed-notification-card";
import { FeedComposer } from "./feed-composer";
import { FeedColumns } from "./feed-columns";
import { FeedFactoryHeader } from "./feed-factory-header";
import {
  useFactoryResolver,
  useFeedFactories,
} from "#/hooks/use-feed-factories";
import { useFeedFilterStore } from "#/stores/feed-filter-store";
import { FeedSortMenu } from "./feed-sort-menu";
import { FeedViewTabs, type FeedView } from "./feed-view-tabs";
import {
  DEFAULT_FEED_SORT,
  sortFeedConversations,
  type FeedSort,
} from "#/utils/feed-sort";

// Loaded on first open so the conversation page stays out of Tower's bundle.
const FeedEmbeddedConversation = lazy(
  () => import("./feed-embedded-conversation"),
);

export function Feed() {
  const { t } = useTranslation("openhands");
  const { openConversationId, close } = useOpenFeedConversation();
  const filter = useFeedFilterStore((state) => state.filter);
  const [view, setView] = useState<FeedView>("feed");
  const [sort, setSort] = useState<FeedSort>(DEFAULT_FEED_SORT);
  const columnRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // The scroll area reserves its scrollbar's width on both edges so cards stay
  // centered; share that width so the tabs, banner and composer match them.
  useLayoutEffect(() => {
    const column = columnRef.current;
    const scroller = scrollRef.current;
    if (!column || !scroller) return undefined;
    const apply = () =>
      column.style.setProperty(
        "--feed-gutter",
        `${scroller.offsetWidth - scroller.clientWidth}px`,
      );
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(scroller);
    return () => observer.disconnect();
  }, []);
  const stackByAgent = sort === "agent";
  const {
    conversations,
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useFeedConversations();

  const resolveFactory = useFactoryResolver();
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
        ) && matchesFeedFilter(c, filter, resolveFactory),
    );
    return [
      ...shown.filter((c) => pinned.has(c.id)),
      ...shown.filter((c) => !pinned.has(c.id)),
    ];
  }, [conversations, filter, sort, pinnedIds, archivedIds, resolveFactory]);

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

  const factories = useFeedFactories();
  const factory = factories.find((f) => f.id === filter.factoryId);
  const setFilter = useFeedFilterStore((state) => state.setFilter);

  // A filter on a factory that no longer exists (deleted, or a demo factory
  // after leaving the demo) would hide every conversation; clear it.
  useEffect(() => {
    if (filter.factoryId && !factory) {
      setFilter({ ...filter, factoryId: null });
    }
  }, [filter, factory, setFilter]);

  if (openConversationId) {
    return (
      <FeedColumns conversationOpen>
        <Suspense fallback={null}>
          <FeedEmbeddedConversation
            key={openConversationId}
            conversationId={openConversationId}
            onClose={close}
          />
        </Suspense>
      </FeedColumns>
    );
  }

  return (
    <FeedColumns
      sidePanel={
        factory ? (
          <FeedFactoryHeader
            factory={factory}
            conversations={conversations}
            variant="column"
          />
        ) : null
      }
    >
      {/* The right column is hidden on narrower screens, so the banner shows
          in the feed there instead. */}
      {factory ? (
        <div className="xl:hidden">
          <FeedFactoryHeader factory={factory} conversations={conversations} />
        </div>
      ) : null}
      <div className="shrink-0 px-[calc(1rem+var(--feed-gutter,0px))] pt-4">
        <div className="mx-auto grid w-full max-w-[680px] grid-cols-[1fr_auto_1fr] items-center">
          <span aria-hidden />
          <FeedViewTabs view={view} onChange={setView} />
          <FeedSortMenu
            sort={sort}
            onChange={setSort}
            className="justify-self-end"
          />
        </div>
      </div>
      <div className="relative min-h-0 flex-1">
        <div
          aria-hidden
          data-testid="feed-fade-top"
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-8 bg-linear-to-b from-canvas-base to-transparent"
        />
        <div
          ref={scrollRef}
          className="custom-scrollbar h-full overflow-y-auto px-4 [scrollbar-gutter:stable_both-edges]"
        >
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
