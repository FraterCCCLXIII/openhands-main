import { useEffect, useMemo, useState } from "react";
import { useUserConversation } from "#/hooks/query/use-user-conversation";
import { useEventStore } from "#/stores/use-event-store";
import type { OpenHandsEvent } from "#/types/agent-server/core";
import { buildConversationMinimapSegments } from "./build-conversation-minimap-segments";
import type { ConversationMinimapSegment } from "./build-conversation-minimap-segments";
import { fetchConversationEventsForMinimap } from "./fetch-conversation-events-for-minimap";

function mergeEventsById(
  fetchedEvents: readonly OpenHandsEvent[],
  liveEvents: readonly OpenHandsEvent[],
): OpenHandsEvent[] {
  const byId = new Map<string, OpenHandsEvent>();

  for (const event of fetchedEvents) {
    if ("id" in event && event.id) {
      byId.set(String(event.id), event);
    }
  }

  for (const event of liveEvents) {
    if ("id" in event && event.id) {
      byId.set(String(event.id), event);
    }
  }

  return [...byId.values()].sort((left, right) => {
    const leftTimestamp = "timestamp" in left ? left.timestamp : undefined;
    const rightTimestamp = "timestamp" in right ? right.timestamp : undefined;
    if (!leftTimestamp && !rightTimestamp) return 0;
    if (!leftTimestamp) return 1;
    if (!rightTimestamp) return -1;
    return leftTimestamp.localeCompare(rightTimestamp);
  });
}

/**
 * Build minimap segments from an independent REST backfill plus whatever the
 * chat store already holds (including live websocket events).
 *
 * @spec MM-001 — Cloud must not use this full-history backfill on open.
 * Until MM-003 (cheap turn index) ships, Cloud segments should come from the
 * chat store only. See specs/conversation-minimap.md.
 */
export function useConversationMinimapSegments(
  conversationId?: string | null,
): readonly ConversationMinimapSegment[] {
  const { data: conversation } = useUserConversation(conversationId ?? null);
  const liveEvents = useEventStore((state) => state.events);
  const [fetchedEvents, setFetchedEvents] = useState<OpenHandsEvent[]>([]);

  useEffect(() => {
    if (!conversationId || !conversation) {
      setFetchedEvents([]);
      return undefined;
    }

    let cancelled = false;

    void fetchConversationEventsForMinimap(
      conversationId,
      conversation.conversation_url,
      conversation.session_api_key,
    )
      .then((events) => {
        if (!cancelled) {
          setFetchedEvents(events);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFetchedEvents([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    conversation,
    conversation?.conversation_url,
    conversation?.session_api_key,
    conversationId,
  ]);

  return useMemo(() => {
    const merged = mergeEventsById(fetchedEvents, liveEvents);
    return buildConversationMinimapSegments(merged);
  }, [fetchedEvents, liveEvents]);
}
