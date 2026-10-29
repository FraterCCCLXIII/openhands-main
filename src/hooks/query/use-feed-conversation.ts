import { useQuery } from "@tanstack/react-query";
import EventService from "#/api/event-service/event-service.api";
import type { AppConversation } from "#/api/conversation-service/agent-server-conversation-service.types";
import type { OpenHandsEvent } from "#/types/agent-server/core";
import { toFeedUpdates } from "#/utils/feed-updates";
import { FEED_QUERY_KEYS } from "./query-keys";

const PAGE_SIZE = 100;
// Stops a runaway history from paging forever; 2,000 events is far past a feed.
const MAX_PAGES = 20;

/**
 * Every readable update in a conversation, oldest first, for the feed card's
 * accordion. Pages through the event history, so enable it only once the user
 * opens the card.
 */
export const useFeedConversation = (
  conversation: AppConversation,
  enabled: boolean,
) =>
  useQuery({
    queryKey: FEED_QUERY_KEYS.conversation(
      conversation.id,
      conversation.updated_at,
      conversation.conversation_url,
      conversation.session_api_key,
    ),
    enabled,
    queryFn: async () => {
      const events: OpenHandsEvent[] = [];
      let pageId: string | undefined;
      for (let page = 0; page < MAX_PAGES; page += 1) {
        const result = await EventService.searchEvents(
          conversation.id,
          conversation.conversation_url,
          conversation.session_api_key,
          { limit: PAGE_SIZE, sortOrder: "TIMESTAMP", pageId },
        );
        events.push(...result.items);
        if (!result.next_page_id) break;
        pageId = result.next_page_id;
      }
      return toFeedUpdates(events, { fullText: true }).reverse();
    },
    retry: false,
    meta: { disableToast: true },
  });
