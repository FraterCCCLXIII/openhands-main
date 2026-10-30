import { create } from "zustand";

/**
 * A message sent from a Tower or factory composer whose conversation is not in
 * the feed's list yet. It renders as an optimistic "Starting…" card and is
 * dropped as soon as the real conversation arrives, so it is never duplicated.
 */
export interface PendingFeedItem {
  id: string;
  text: string;
  factoryId: string | null;
  agentName: string;
  /** Epoch ms, for ordering and the "taking too long" state. */
  createdAt: number;
  /**
   * The id the create call returned: the real conversation id, or a temporary
   * `task-` id while a Cloud sandbox provisions. Null until the call returns.
   */
  conversationId: string | null;
  status: "starting" | "failed";
}

interface FeedPendingState {
  items: PendingFeedItem[];
}

interface FeedPendingActions {
  add: (item: Omit<PendingFeedItem, "status" | "conversationId">) => void;
  attach: (id: string, conversationId: string) => void;
  /** A temporary task id became the real conversation id. */
  replaceConversationId: (fromId: string, toId: string) => void;
  fail: (id: string) => void;
  remove: (id: string) => void;
  /** Drops every card whose conversation the list now has. */
  removeArrived: (arrivedIds: ReadonlySet<string>) => void;
}

// A page reload loses this on purpose: the real conversation is in the list.
const MAX_PENDING = 20;

/** Owns the optimistic cards for conversations that are still starting. */
export const useFeedPendingStore = create<
  FeedPendingState & FeedPendingActions
>()((set) => ({
  items: [],
  add: (item) =>
    set((state) => ({
      items: [
        ...state.items,
        { ...item, conversationId: null, status: "starting" as const },
      ].slice(-MAX_PENDING),
    })),
  attach: (id, conversationId) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, conversationId } : item,
      ),
    })),
  replaceConversationId: (fromId, toId) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.conversationId === fromId
          ? { ...item, conversationId: toId }
          : item,
      ),
    })),
  fail: (id) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, status: "failed" as const } : item,
      ),
    })),
  remove: (id) =>
    set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
  removeArrived: (arrivedIds) =>
    set((state) => {
      const items = state.items.filter(
        (item) => !item.conversationId || !arrivedIds.has(item.conversationId),
      );
      return items.length === state.items.length ? state : { items };
    }),
}));
