import { create } from "zustand";
import {
  abortStreamingSlot,
  appendStreamingDeltas,
  clearStreamingSlots,
  handleEventForUI,
  openStreamingSlot,
  type StreamingSlotMeta,
  type UIEvent,
} from "#/utils/handle-event-for-ui";
import type {
  DeltaFrame,
  ItemStartedFrame,
} from "#/types/agent-server/session-frames";

export type OHEvent = UIEvent;

/**
 * One conversation's event stream. Buckets are keyed by conversation id so a
 * secondary conversation (e.g. a fork rendered in a floating window) can stream
 * alongside the routed one without either clearing the other's history.
 */
export interface ConversationEventBucket {
  events: OHEvent[];
  eventIds: Set<string | number>;
  uiEvents: OHEvent[];
}

/**
 * Shared frozen empties. Selectors for a conversation with no bucket yet must
 * return a stable reference — a fresh `[]` per call would change identity on
 * every render and spin Zustand subscribers into an infinite update loop.
 */
export const EMPTY_EVENTS: OHEvent[] = Object.freeze(
  [] as OHEvent[],
) as unknown as OHEvent[];

const EMPTY_BUCKET: ConversationEventBucket = Object.freeze({
  events: EMPTY_EVENTS,
  eventIds: Object.freeze(new Set<string | number>()) as Set<string | number>,
  uiEvents: EMPTY_EVENTS,
});

const getEventId = (event: OHEvent): string | number | undefined =>
  "id" in event ? event.id : undefined;

const getEventTimestamp = (event: OHEvent): string | undefined =>
  "timestamp" in event ? event.timestamp : undefined;

/**
 * Compare two events by timestamp for sorting.
 * Events without timestamps are placed at the end.
 */
const compareEventsByTimestamp = (a: OHEvent, b: OHEvent): number => {
  const timestampA = getEventTimestamp(a);
  const timestampB = getEventTimestamp(b);

  // Events without timestamps go to the end
  if (!timestampA && !timestampB) return 0;
  if (!timestampA) return 1;
  if (!timestampB) return -1;

  // Compare ISO timestamp strings (lexicographic comparison works for ISO format)
  return timestampA.localeCompare(timestampB);
};

/**
 * Check if the new event needs sorting (i.e., it's out of order).
 * Returns true if the new event's timestamp is earlier than the last event's timestamp.
 */
const needsSorting = (events: OHEvent[], newEvent: OHEvent): boolean => {
  if (events.length === 0) return false;

  const lastEvent = events[events.length - 1];
  const lastTimestamp = getEventTimestamp(lastEvent);
  const newTimestamp = getEventTimestamp(newEvent);

  // If either event doesn't have a timestamp, don't sort
  if (!lastTimestamp || !newTimestamp) return false;

  // Sort needed if new event's timestamp is earlier than last event's timestamp
  return newTimestamp < lastTimestamp;
};

export interface EventState {
  /**
   * Event buckets keyed by conversation id. A key is present once the
   * conversation has been loaded, which is how callers distinguish a genuine
   * conversation switch from a remount of the same conversation (e.g.
   * navigating to Settings and back) — only the former should reset events.
   */
  byConversation: Record<string, ConversationEventBucket>;
  addEvent: (conversationId: string, event: OHEvent) => void;
  /**
   * Bulk-insert events. Used for the initial REST history load and for
   * "scroll up to load older" pagination. Newly-added events are de-duped
   * against the existing bucket and the combined list is re-sorted by
   * timestamp so older pages drop into the correct position.
   */
  addEvents: (conversationId: string, events: OHEvent[]) => void;
  /**
   * Start (or restart) a conversation with an empty bucket, marking it loaded.
   * Collapsing the reset and the bookkeeping into a single `set` keeps the
   * store invariant enforced at the boundary, rather than relying on every
   * call-site to clear and register in the right order.
   */
  loadConversation: (conversationId: string) => void;
  /** Drop a single conversation's bucket, e.g. when its window is closed. */
  clearConversation: (conversationId: string) => void;
  /** Drop every conversation's events. */
  clearEvents: () => void;
  /**
   * Streaming slots. They live only in `uiEvents`: nothing reads `events` for
   * provisional text, and keeping them out means their id — which is the id
   * the durable event will carry — can never be mistaken for one already seen
   * and dedupe the real message away.
   */
  openStreamingSlot: (
    conversationId: string,
    frame: ItemStartedFrame,
    meta?: StreamingSlotMeta,
  ) => void;
  appendStreamingDeltas: (
    conversationId: string,
    frames: DeltaFrame[],
    meta?: StreamingSlotMeta,
  ) => void;
  abortStreamingSlot: (
    conversationId: string,
    itemId: string,
    attempt?: number,
  ) => void;
  /** Discard every open slot for one socket (on connect and disconnect). */
  clearStreamingSlots: (
    conversationId: string,
    isFromPlanningAgent?: boolean,
  ) => void;
  isConversationLoaded: (conversationId: string) => boolean;
}

const getBucket = (
  state: EventState,
  conversationId: string,
): ConversationEventBucket =>
  state.byConversation[conversationId] ?? EMPTY_BUCKET;

const withBucket = (
  state: EventState,
  conversationId: string,
  bucket: ConversationEventBucket,
): EventState => ({
  ...state,
  byConversation: { ...state.byConversation, [conversationId]: bucket },
});

const appendEvent = (
  bucket: ConversationEventBucket,
  event: OHEvent,
): ConversationEventBucket => {
  // Deduplicate: skip if event with same id already exists (O(1) lookup)
  const eventId = getEventId(event);
  if (eventId !== undefined && bucket.eventIds.has(eventId)) {
    return bucket;
  }

  const newEventIds =
    eventId !== undefined
      ? new Set(bucket.eventIds).add(eventId)
      : bucket.eventIds;

  return {
    events: [...bucket.events, event],
    eventIds: newEventIds,
    uiEvents: handleEventForUI(event, bucket.uiEvents),
  };
};

const sortBucket = (
  bucket: ConversationEventBucket,
): ConversationEventBucket => ({
  ...bucket,
  events: [...bucket.events].sort(compareEventsByTimestamp),
  uiEvents: [...bucket.uiEvents].sort(compareEventsByTimestamp),
});

const applyAddEvent = (
  bucket: ConversationEventBucket,
  event: OHEvent,
): ConversationEventBucket => {
  const next = appendEvent(bucket, event);
  if (next === bucket) {
    return bucket;
  }

  if (
    !needsSorting(bucket.events, event) &&
    !needsSorting(bucket.uiEvents, event)
  ) {
    return next;
  }

  return sortBucket(next);
};

export const useEventStore = create<EventState>()((set, get) => ({
  byConversation: {},
  addEvent: (conversationId: string, event: OHEvent) =>
    set((state) => {
      const bucket = getBucket(state, conversationId);
      const next = applyAddEvent(bucket, event);
      if (next === bucket && state.byConversation[conversationId]) {
        return state;
      }
      return withBucket(state, conversationId, next);
    }),
  addEvents: (conversationId: string, incoming: OHEvent[]) =>
    set((state) => {
      if (incoming.length === 0) return state;

      const bucket = getBucket(state, conversationId);
      const eventIds = new Set(bucket.eventIds);
      const events = [...bucket.events];
      let uiEvents = [...bucket.uiEvents];
      let added = false;

      for (const event of incoming) {
        const eventId = getEventId(event);
        const isDuplicate = eventId !== undefined && eventIds.has(eventId);

        if (!isDuplicate) {
          added = true;
          if (eventId !== undefined) {
            eventIds.add(eventId);
          }

          events.push(event);
          uiEvents = handleEventForUI(event, uiEvents);
        }
      }

      if (!added && state.byConversation[conversationId]) {
        return state;
      }

      return withBucket(
        state,
        conversationId,
        sortBucket({ events, eventIds, uiEvents }),
      );
    }),
  loadConversation: (conversationId: string) =>
    set((state) =>
      withBucket(state, conversationId, {
        events: [],
        eventIds: new Set(),
        uiEvents: [],
      }),
    ),
  clearConversation: (conversationId: string) =>
    set((state) => {
      if (!state.byConversation[conversationId]) return state;
      const byConversation = { ...state.byConversation };
      delete byConversation[conversationId];
      return { ...state, byConversation };
    }),
  clearEvents: () => set((state) => ({ ...state, byConversation: {} })),
  openStreamingSlot: (
    conversationId: string,
    frame: ItemStartedFrame,
    meta: StreamingSlotMeta = {},
  ) =>
    set((state) => {
      const bucket = getBucket(state, conversationId);
      // Symmetric with `appendStreamingDeltas`: the durable event being in
      // the store means the stream is over, and a slot opened now could never
      // be retired — `appendEvent` dedupes the durable frame before
      // `handleEventForUI` could replace it.
      if (bucket.eventIds.has(frame.item_id)) {
        return state;
      }
      const uiEvents = openStreamingSlot(frame, bucket.uiEvents, meta);
      return uiEvents === bucket.uiEvents
        ? state
        : withBucket(state, conversationId, { ...bucket, uiEvents });
    }),
  appendStreamingDeltas: (
    conversationId: string,
    frames: DeltaFrame[],
    meta: StreamingSlotMeta = {},
  ) =>
    set((state) => {
      const bucket = getBucket(state, conversationId);
      const uiEvents = appendStreamingDeltas(frames, bucket.uiEvents, {
        ...meta,
        // The durable event carries the item's id, so seeing it means the
        // stream is over and a straggling delta must not reopen it.
        isFinished: (itemId) => bucket.eventIds.has(itemId),
      });
      return uiEvents === bucket.uiEvents
        ? state
        : withBucket(state, conversationId, { ...bucket, uiEvents });
    }),
  abortStreamingSlot: (
    conversationId: string,
    itemId: string,
    attempt?: number,
  ) =>
    set((state) => {
      const bucket = getBucket(state, conversationId);
      const uiEvents = abortStreamingSlot(itemId, bucket.uiEvents, attempt);
      return uiEvents === bucket.uiEvents
        ? state
        : withBucket(state, conversationId, { ...bucket, uiEvents });
    }),
  clearStreamingSlots: (
    conversationId: string,
    isFromPlanningAgent = false,
  ) =>
    set((state) => {
      const bucket = getBucket(state, conversationId);
      const uiEvents = clearStreamingSlots(bucket.uiEvents, isFromPlanningAgent);
      return uiEvents === bucket.uiEvents
        ? state
        : withBucket(state, conversationId, { ...bucket, uiEvents });
    }),
  isConversationLoaded: (conversationId: string) =>
    !!get().byConversation[conversationId],
}));

/** Read a conversation's events outside React (effects, imperative helpers). */
export const getConversationEvents = (
  conversationId: string | null | undefined,
): OHEvent[] =>
  conversationId
    ? (useEventStore.getState().byConversation[conversationId]?.events ??
      EMPTY_EVENTS)
    : EMPTY_EVENTS;

/** Read a conversation's UI events outside React. */
export const getConversationUiEvents = (
  conversationId: string | null | undefined,
): OHEvent[] =>
  conversationId
    ? (useEventStore.getState().byConversation[conversationId]?.uiEvents ??
      EMPTY_EVENTS)
    : EMPTY_EVENTS;

// In dev builds, expose the store on `window` so that fixture/preview
// scripts (e.g. .pr/issue-132 demo capture) can inject synthetic events
// without round-tripping through the agent-server. Tree-shaken in
// production builds via `import.meta.env.DEV`.
if (
  typeof window !== "undefined" &&
  typeof import.meta !== "undefined" &&
  (import.meta as { env?: { DEV?: boolean } }).env?.DEV
) {
  (
    window as unknown as { __OH_EVENT_STORE__?: typeof useEventStore }
  ).__OH_EVENT_STORE__ = useEventStore;
}
