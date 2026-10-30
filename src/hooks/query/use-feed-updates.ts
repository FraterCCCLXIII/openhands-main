import { keepPreviousData, useQuery } from "@tanstack/react-query";
import EventService from "#/api/event-service/event-service.api";
import type { AppConversation } from "#/api/conversation-service/agent-server-conversation-service.types";
import { ExecutionStatus } from "#/types/agent-server/core";
import { FEED_UPDATE_LIMIT, toFeedUpdates } from "#/utils/feed-updates";
import { FEED_QUERY_KEYS } from "./query-keys";

// How often a card whose agent is working re-reads its latest updates when no
// live socket feeds it, and how often as a safety net when one does.
export const LIVE_POLL_MS = 2_500;
export const LIVE_POLL_WITH_SOCKET_MS = 20_000;

// Newest events include chatty non-message ones (state updates, observations),
// so read a wider window than the number of updates a card shows.
const EVENT_WINDOW = FEED_UPDATE_LIMIT * 4;

/**
 * The latest readable updates for one feed card. Refetches whenever the
 * conversation list reports new activity (`updated_at` changes) and polls
 * while the agent is running, so a compressed card stays current without
 * opening the conversation.
 */
export const useFeedUpdates = (
  conversation: AppConversation,
  enabled: boolean,
  socketConnected = false,
) =>
  useQuery({
    queryKey: FEED_QUERY_KEYS.updates(
      conversation.id,
      conversation.updated_at,
      conversation.conversation_url,
      conversation.session_api_key,
    ),
    enabled,
    queryFn: async () => {
      const page = await EventService.searchEvents(
        conversation.id,
        conversation.conversation_url,
        conversation.session_api_key,
        { limit: EVENT_WINDOW, sortOrder: "TIMESTAMP_DESC" },
      );
      return toFeedUpdates(page.items).slice(0, FEED_UPDATE_LIMIT);
    },
    placeholderData: keepPreviousData,
    // A conversation can be listed while its events are gone; that is a quiet
    // empty card, not an error toast.
    retry: false,
    meta: { disableToast: true },
    refetchInterval:
      conversation.execution_status === ExecutionStatus.RUNNING
        ? socketConnected
          ? LIVE_POLL_WITH_SOCKET_MS
          : LIVE_POLL_MS
        : false,
    refetchIntervalInBackground: false,
  });
