import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import EventService from "#/api/event-service/event-service.api";
import type { AppConversation } from "#/api/conversation-service/agent-server-conversation-service.types";
import { useWebSocket } from "#/hooks/use-websocket";
import type { OpenHandsEvent } from "#/types/agent-server/core";
import { asSessionFrame } from "#/types/agent-server/session-frames";
import { toFeedUpdates, type FeedUpdate } from "#/utils/feed-updates";
import { FEED_QUERY_KEYS } from "#/hooks/query/query-keys";
import { buildWebSocketUrl } from "#/utils/websocket-url";

/** At most this many feed cards hold a live socket at once. */
export const FEED_LIVE_MAX_SOCKETS = 4;
// Token deltas are coalesced so a fast model re-renders a card ~20x a second.
export const FEED_LIVE_THROTTLE_MS = 50;
// Stats, status and the card list refresh at most this often while events flow.
const REFRESH_MS = 3_000;
const EVENT_BUFFER = 60;

const holders = new Set<string>();
const waiting = new Set<() => void>();

const acquireSlot = (id: string): boolean => {
  if (holders.has(id)) return true;
  if (holders.size >= FEED_LIVE_MAX_SOCKETS) return false;
  holders.add(id);
  return true;
};

const releaseSlot = (id: string) => {
  if (!holders.delete(id)) return;
  // Hand the freed slot to a card that was turned away.
  waiting.forEach((retry) => retry());
};

/** Test hook: how many cards hold a socket slot. */
export const liveSocketCount = () => holders.size;

interface LiveSnapshot {
  events: OpenHandsEvent[];
  /** The agent message being written; null when none is in progress. */
  streamingText: string | null;
}

const EMPTY: LiveSnapshot = { events: [], streamingText: null };

/**
 * Live updates for one feed card from the conversation's own session socket
 * (durable events plus streamed text deltas). A socket is held only while the
 * card is `wanted` (visible, agent running) and one of a small, shared number
 * of slots is free; otherwise `connected` is false and the caller polls.
 */
export function useFeedLiveStream(
  conversation: AppConversation,
  wanted: boolean,
) {
  const queryClient = useQueryClient();
  const { id, conversation_url: conversationUrl } = conversation;
  const [hasSlot, setHasSlot] = useState(false);
  const [afterSeq, setAfterSeq] = useState<number | null>(null);
  const [connected, setConnected] = useState(false);
  const [snapshot, setSnapshot] = useState<LiveSnapshot>(EMPTY);

  const eventsRef = useRef<OpenHandsEvent[]>([]);
  const streamRef = useRef<{ itemId: string; text: string } | null>(null);
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRefresh = useRef(0);

  const eligible = wanted && !!conversationUrl;

  // Take a socket slot while wanted; give it back when not.
  useEffect(() => {
    if (!eligible) return undefined;
    const tryAcquire = () => {
      if (acquireSlot(id)) setHasSlot(true);
    };
    tryAcquire();
    waiting.add(tryAcquire);
    return () => {
      waiting.delete(tryAcquire);
      releaseSlot(id);
      setHasSlot(false);
      setConnected(false);
      setAfterSeq(null);
      streamRef.current = null;
    };
  }, [eligible, id]);

  // Resume after the newest event the log already holds: the card has them.
  useEffect(() => {
    if (!hasSlot || !conversationUrl) return undefined;
    let cancelled = false;
    EventService.getEventCount(
      id,
      conversationUrl,
      conversation.session_api_key ?? null,
    )
      .then((count) => {
        if (!cancelled) setAfterSeq(count - 1);
      })
      .catch(() => {
        // Without a cursor the whole log would replay, so no socket opens and
        // the card keeps polling.
      });
    return () => {
      cancelled = true;
    };
  }, [hasSlot, id, conversationUrl, conversation.session_api_key]);

  const flush = useCallback(() => {
    flushTimer.current = null;
    setSnapshot({
      events: [...eventsRef.current],
      streamingText: streamRef.current ? streamRef.current.text : null,
    });
  }, []);

  const schedule = useCallback(() => {
    if (flushTimer.current === null) {
      flushTimer.current = setTimeout(flush, FEED_LIVE_THROTTLE_MS);
    }
  }, [flush]);

  const refreshStats = useCallback(() => {
    const now = Date.now();
    if (now - lastRefresh.current < REFRESH_MS) return;
    lastRefresh.current = now;
    void queryClient.invalidateQueries({ queryKey: FEED_QUERY_KEYS.all });
    void queryClient.invalidateQueries({ queryKey: ["conversation-metrics"] });
    void queryClient.invalidateQueries({ queryKey: ["user", "conversations"] });
  }, [queryClient]);

  const onMessage = useCallback(
    (message: MessageEvent) => {
      let frame;
      try {
        frame = asSessionFrame(JSON.parse(message.data));
      } catch {
        return;
      }
      if (!frame) return;
      switch (frame.type) {
        case "item_started":
          streamRef.current = { itemId: frame.item_id, text: "" };
          schedule();
          break;
        case "delta":
          if (frame.kind === "reasoning") break;
          if (streamRef.current?.itemId !== frame.item_id) {
            streamRef.current = { itemId: frame.item_id, text: "" };
          }
          streamRef.current.text += frame.content;
          schedule();
          break;
        case "item_aborted":
          if (streamRef.current?.itemId === frame.item_id) {
            streamRef.current = null;
            schedule();
          }
          break;
        case "durable":
        case "transient": {
          const { event } = frame;
          if (!event || typeof event.id !== "string") break;
          // The finished message replaces its in-progress text.
          if (streamRef.current?.itemId === event.id) streamRef.current = null;
          eventsRef.current = [
            ...eventsRef.current.filter((known) => known.id !== event.id),
            event,
          ].slice(-EVENT_BUFFER);
          schedule();
          if (frame.type === "durable") refreshStats();
          break;
        }
        default:
          break;
      }
    },
    [schedule, refreshStats],
  );

  const url =
    hasSlot && afterSeq !== null
      ? (buildWebSocketUrl(id, conversationUrl) ?? "")
      : "";

  useWebSocket(url, {
    queryParams: { after_seq: String(afterSeq ?? -1) },
    sessionApiKey: conversation.session_api_key,
    reconnect: { enabled: true },
    onOpen: () => setConnected(true),
    onClose: () => {
      setConnected(false);
      // Progress frames are never replayed; drop a half-written slot.
      streamRef.current = null;
      schedule();
    },
    onMessage,
  });

  // Nothing carries over to another conversation or a later live period.
  useEffect(
    () => () => {
      if (flushTimer.current) clearTimeout(flushTimer.current);
      flushTimer.current = null;
      eventsRef.current = [];
      streamRef.current = null;
    },
    [id],
  );

  const updates = useMemo<FeedUpdate[]>(
    () =>
      snapshot.events.length === 0
        ? []
        : toFeedUpdates([...snapshot.events].reverse()),
    [snapshot.events],
  );

  return {
    connected,
    updates,
    streamingText: connected ? snapshot.streamingText : null,
  };
}
