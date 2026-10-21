import EventService from "#/api/event-service/event-service.api";
import { INITIAL_HISTORY_PAGE_SIZE } from "#/hooks/query/use-conversation-history";
import type { EventSearchPage } from "#/api/event-service/event-service.types";
import type { OpenHandsEvent } from "#/types/agent-server/core";

export function hasMoreEventSearchPages(
  page: { next_page_id?: string | null; items: unknown[] },
  pageSize = INITIAL_HISTORY_PAGE_SIZE,
): boolean {
  return !!page.next_page_id || page.items.length >= pageSize;
}

export function isEventSearchExhausted(
  page: { next_page_id?: string | null; items: unknown[] },
  pageSize = INITIAL_HISTORY_PAGE_SIZE,
): boolean {
  return (
    page.items.length === 0 ||
    (!page.next_page_id && page.items.length < pageSize)
  );
}

type EventSearchContext = {
  conversationId: string;
  conversationUrl: string | null | undefined;
  sessionApiKey: string | null | undefined;
};

/**
 * Walk the server's `next_page_id` chain (newest → older). Prefer this over
 * `timestamp__lt` cursors: many events can share a timestamp, so strict
 * less-than filters skip entire pages.
 */
export async function fetchEventSearchPagesNewestFirst(
  context: EventSearchContext,
  startPageId?: string | null,
): Promise<OpenHandsEvent[]> {
  const accumulated: OpenHandsEvent[] = [];
  let pageId = startPageId ?? undefined;

  while (true) {
    const page: EventSearchPage<OpenHandsEvent> =
      await EventService.searchEvents(
        context.conversationId,
        context.conversationUrl,
        context.sessionApiKey,
        {
          limit: INITIAL_HISTORY_PAGE_SIZE,
          sortOrder: "TIMESTAMP_DESC",
          ...(pageId ? { pageId } : {}),
        },
      );

    if (!Array.isArray(page.items)) {
      throw new Error(
        "Invalid event search response: expected page.items to be an array.",
      );
    }

    if (page.items.length === 0) {
      break;
    }

    accumulated.unshift(...[...page.items].reverse());

    if (!page.next_page_id) {
      break;
    }

    pageId = page.next_page_id;
  }

  return accumulated;
}

/**
 * Fetch the full conversation event history for minimap rendering. Does not
 * mutate the chat event store, so chat scroll-up pagination stays independent.
 *
 * @spec MM-001 — Do not walk full event history to build the Cloud minimap
 * This full-page walk is the expensive Cloud open-path. Replace it with the
 * chat store (until MM-003) or a cheap turn index (MM-003). See
 * specs/conversation-minimap.md.
 */
export async function fetchConversationEventsForMinimap(
  conversationId: string,
  conversationUrl: string | null | undefined,
  sessionApiKey: string | null | undefined,
): Promise<OpenHandsEvent[]> {
  return fetchEventSearchPagesNewestFirst({
    conversationId,
    conversationUrl,
    sessionApiKey,
  });
}
