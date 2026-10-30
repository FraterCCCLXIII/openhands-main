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
import { FeedPendingCard } from "./feed-pending-card";
import { useFeedPendingStore } from "#/stores/feed-pending-store";
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
import { FeedViewTabs } from "./feed-view-tabs";
import { FeedInboxList } from "./feed-inbox-list";
import { useFeedView } from "#/hooks/use-feed-view";
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
  const { view, inboxFactoryParam, setView, setInboxFactoryParam } =
    useFeedView();
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

  // Optimistic cards for conversations still starting. Each goes as soon as the
  // real conversation is in the list, so the two are never shown together.
  const pendingItems = useFeedPendingStore((state) => state.items);
  const dismissPending = useFeedPendingStore((state) => state.remove);
  useEffect(() => {
    if (pendingItems.length === 0) return;
    useFeedPendingStore
      .getState()
      .removeArrived(new Set(conversations.map((c) => c.id)));
  }, [pendingItems, conversations]);
  const pendingCards = pendingItems.filter(
    (item) =>
      (!item.conversationId ||
        !conversations.some((c) => c.id === item.conversationId)) &&
      (!filter.factoryId || item.factoryId === filter.factoryId),
  );
  const newestPendingId = pendingCards.at(-1)?.id ?? null;
  const pendingCount = pendingCards.length;

  // A message just sent: show it at the top of the feed and move focus to it.
  // The Inbox tab already lists what was sent, so it stays open.
  const viewRef = useRef(view);
  viewRef.current = view;
  useEffect(() => {
    if (!newestPendingId) return;
    if (viewRef.current === "notifications") setView("feed");
    const scroller = scrollRef.current;
    scroller?.scrollTo?.({ top: 0 });
    scroller
      ?.querySelector<HTMLElement>(`[data-pending-id="${newestPendingId}"]`)
      ?.focus({ preventScroll: true });
  }, [newestPendingId]);

  let body;
  if (isLoading) {
    body = null;
  } else if (isError) {
    body = <p className="text-sm text-muted">{t(I18nKey.FEED$LOAD_ERROR)}</p>;
  } else if (pendingCount > 0 && conversations.length === 0) {
    body = null;
  } else if (conversations.length === 0) {
    body = (
      <p data-testid="feed-empty" className="text-sm text-muted">
        {t(I18nKey.FEED$EMPTY)}
      </p>
    );
  } else if (visible.length === 0 && pendingCount === 0) {
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

  // The inbox is scoped by the selected factory, which has one owner: the feed
  // filter. The URL param only carries it across reload and links, so
  // whichever of the two changed last is copied to the other.
  const scopeSync = useRef<{
    param: string | null | undefined;
    id: string | null;
  }>({
    param: undefined,
    id: filter.factoryId,
  });
  useEffect(() => {
    if (view !== "inbox") {
      scopeSync.current = { param: undefined, id: filter.factoryId };
      return;
    }
    const previous = scopeSync.current;
    scopeSync.current = { param: inboxFactoryParam, id: filter.factoryId };
    if (inboxFactoryParam !== previous.param) {
      if (inboxFactoryParam !== filter.factoryId) {
        setFilter({ ...filter, factoryId: inboxFactoryParam });
      }
    } else if (
      filter.factoryId !== previous.id &&
      filter.factoryId !== inboxFactoryParam
    ) {
      setInboxFactoryParam(filter.factoryId);
    }
    // setInboxFactoryParam and setFilter are stable enough for this sync.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, inboxFactoryParam, filter.factoryId]);

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
          <FeedViewTabs
            view={view}
            onChange={(next) => setView(next, filter.factoryId)}
          />
          {view === "inbox" ? (
            <span aria-hidden />
          ) : (
            <FeedSortMenu
              sort={sort}
              onChange={setSort}
              className="justify-self-end"
            />
          )}
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
            {view === "inbox" ? (
              <div
                id="feed-tabpanel"
                role="tabpanel"
                aria-labelledby="feed-tab-inbox"
              >
                <FeedInboxList factoryId={filter.factoryId} />
              </div>
            ) : null}
            {view === "inbox" ? null : (
              <section
                id="feed-tabpanel"
                role="tabpanel"
                aria-labelledby={`feed-tab-${view}`}
                data-testid="feed"
                className={cn(
                  "flex flex-col",
                  view === "feed" ? "gap-4" : "gap-2",
                )}
              >
                {view === "feed"
                  ? [...pendingCards]
                      .reverse()
                      .map((item) => (
                        <FeedPendingCard
                          key={item.id}
                          item={item}
                          onDismiss={dismissPending}
                        />
                      ))
                  : null}
                {body}
              </section>
            )}
            {hasNextPage && view !== "inbox" ? (
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
