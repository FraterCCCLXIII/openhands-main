import React from "react";
import EventService from "#/api/event-service/event-service.api";
import { useUserConversation } from "#/hooks/query/use-user-conversation";
import { useEventStore } from "#/stores/use-event-store";
import {
  INITIAL_HISTORY_PAGE_SIZE,
  useConversationHistory,
} from "#/hooks/query/use-conversation-history";
import { isTaskConversationId } from "#/utils/conversation-local-storage";
import { seedModelSwitchesFromHistory } from "#/hooks/chat/record-model-switch-message";
import type { OpenHandsEvent } from "#/types/agent-server/core";
import { isEventSearchExhausted } from "#/components/features/chat/conversation-minimap/fetch-conversation-events-for-minimap";

const getEventTimestamp = (event: OpenHandsEvent): string | undefined =>
  "timestamp" in event ? event.timestamp : undefined;

interface UseLoadOlderEventsResult {
  /** True while a "load older" request is in flight. */
  isLoading: boolean;
  /**
   * Whether the server may have more events older than what we currently
   * have in the store. Starts `true` and flips to `false` after the server
   * returns a short page (i.e. it ran out of older events).
   */
  hasMore: boolean;
  /**
   * Trigger one more older-events page. Resolves after the page is merged, or
   * without changing state if the load became stale.
   */
  loadOlder: () => Promise<void>;
}

/**
 * REST-side companion to `useConversationHistory`: paginates older events
 * into the event store on demand. Used by the chat scroll handler to lazily
 * backfill history when the user scrolls up.
 *
 * Pagination prefers the server's `next_page_id` chain from the initial REST
 * tail fetch. Timestamp cursors are only used as a fallback when no page id is
 * available — `timestamp__lt` breaks when multiple events share the same
 * timestamp (common in seeded/demo transcripts).
 */
export const useLoadOlderEvents = (
  conversationId?: string | null,
): UseLoadOlderEventsResult => {
  const isTaskConversation =
    !!conversationId && isTaskConversationId(conversationId);
  const realConversationId = isTaskConversation ? undefined : conversationId;

  const { data: conversation } = useUserConversation(conversationId ?? null);
  const { data: initialHistory, isFetched: isInitialHistoryFetched } =
    useConversationHistory(realConversationId ?? undefined);
  const addEvents = useEventStore((state) => state.addEvents);

  const [isLoading, setIsLoading] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);
  const isLoadingRef = React.useRef(false);
  const hasMoreRef = React.useRef(true);
  const nextPageIdRef = React.useRef<string | null>(null);
  const activeLoadMarkerRef = React.useRef<object | null>(null);

  React.useEffect(() => {
    return () => {
      activeLoadMarkerRef.current = null;
    };
  }, [conversationId]);

  React.useEffect(() => {
    isLoadingRef.current = false;
    setIsLoading(false);
    nextPageIdRef.current = null;

    if (isTaskConversation) {
      hasMoreRef.current = false;
      setHasMore(false);
      return;
    }

    hasMoreRef.current = true;
    setHasMore(true);
  }, [conversationId, isTaskConversation]);

  // Seed the page-id cursor from the initial REST tail fetch.
  React.useEffect(() => {
    if (isTaskConversation || !isInitialHistoryFetched || !initialHistory) {
      return;
    }
    nextPageIdRef.current = initialHistory.nextPageId;
    if (!initialHistory.hasMore) {
      hasMoreRef.current = false;
      setHasMore(false);
    }
  }, [
    isTaskConversation,
    isInitialHistoryFetched,
    initialHistory?.hasMore,
    initialHistory?.nextPageId,
    realConversationId,
  ]);

  const loadOlder = React.useCallback(async () => {
    if (
      !conversationId ||
      isTaskConversationId(conversationId) ||
      isLoadingRef.current ||
      !hasMoreRef.current
    ) {
      return;
    }

    // Cloud/local metadata (runtime URL, session key) isn't available on
    // start-task placeholder routes and may still be loading right after
    // redirect from `/conversations/task-{uuid}`.
    if (!conversation) {
      return;
    }

    const { events } = useEventStore.getState();
    const oldest = events[0];
    const pageId = nextPageIdRef.current;

    // No anchor yet — defer until the initial REST load has populated the
    // store (avoids fetching twice with the same `TIMESTAMP_DESC` window).
    if (!oldest && !pageId) return;

    const oldestTimestamp = oldest ? getEventTimestamp(oldest) : undefined;
    if (!pageId && !oldestTimestamp) {
      // Nothing paginate-able — treat as exhausted rather than surfacing an
      // error banner on brand-new conversations.
      hasMoreRef.current = false;
      setHasMore(false);
      return;
    }

    isLoadingRef.current = true;
    setIsLoading(true);
    const loadMarker = {};
    activeLoadMarkerRef.current = loadMarker;
    const isActiveLoad = () =>
      activeLoadMarkerRef.current === loadMarker &&
      useEventStore.getState().loadedConversationId === conversationId;

    try {
      const page = await EventService.searchEvents(
        conversationId,
        conversation?.conversation_url ?? null,
        conversation?.session_api_key ?? null,
        {
          limit: INITIAL_HISTORY_PAGE_SIZE,
          sortOrder: "TIMESTAMP_DESC",
          ...(pageId ? { pageId } : { timestampLt: oldestTimestamp }),
        },
      );

      // Conversation switches atomically replace `loadedConversationId` and
      // clear the global event store. Do not merge this page if the store now
      // belongs to another conversation. There is no `await` below this guard,
      // so a navigation cannot interleave between the check and `addEvents`.
      if (!isActiveLoad()) {
        return;
      }

      if (!Array.isArray(page.items)) {
        throw new Error(
          "Invalid older-events response: expected page.items to be an array.",
        );
      }

      const older = [...page.items].reverse();
      if (older.length > 0) {
        addEvents(older);
        // The initial preload only seeds switches from the tail page; a switch
        // in an older page is hidden as a card but never seeded — silently lost.
        // Reseed over the merged `uiEvents` (idempotent) so it still surfaces.
        seedModelSwitchesFromHistory(
          conversationId,
          useEventStore.getState().uiEvents,
        );
      }

      nextPageIdRef.current = page.next_page_id ?? null;

      if (isEventSearchExhausted(page)) {
        hasMoreRef.current = false;
        setHasMore(false);
      }
    } catch (error) {
      // Errors from an abandoned conversation are no longer relevant to the
      // active view. Preserve the existing error behavior for current loads.
      if (isActiveLoad()) {
        throw error;
      }
    } finally {
      // A newer conversation may already have its own request in flight; an
      // older request must not clear that request's loading state.
      if (isActiveLoad()) {
        activeLoadMarkerRef.current = null;
        isLoadingRef.current = false;
        setIsLoading(false);
      }
    }
  }, [
    conversationId,
    conversation,
    conversation?.conversation_url,
    conversation?.session_api_key,
    addEvents,
  ]);

  return { isLoading, hasMore, loadOlder };
};
