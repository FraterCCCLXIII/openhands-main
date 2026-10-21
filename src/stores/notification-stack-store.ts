import { create } from "zustand";

export type StackNotificationKind = "error" | "warning";

export interface StackNotification {
  id: string;
  kind: StackNotificationKind;
  message: string;
  /** How many times this same message has been raised since it was shown. */
  count: number;
  /** Auto-dismiss delay for the front card, in milliseconds. */
  duration: number;
  /** Bumped on every repeat so the front card restarts its timer. */
  updatedAt: number;
}

/** Oldest notifications beyond this are dropped so the deck stays small. */
const MAX_NOTIFICATIONS = 20;

interface NotificationStackState {
  /** Front of the deck is index 0 — the card the user sees on top. */
  items: StackNotification[];
  /** Adds a notification, or folds a repeat of an open one into its count. */
  push: (
    kind: StackNotificationKind,
    message: string,
    duration: number,
  ) => void;
  dismiss: (id: string) => void;
  /** Moves the front card to the back, revealing the one beneath it. */
  cycle: () => void;
}

/**
 * The single owner of error and warning notices shown in the top-right stack.
 * Repeats of the same kind and message are merged, so a failure that keeps
 * happening shows one card with a count instead of a column of copies.
 */
export const useNotificationStackStore = create<NotificationStackState>()(
  (set) => ({
    items: [],
    push: (kind, message, duration) =>
      set((state) => {
        const now = Date.now();
        const existing = state.items.find(
          (item) => item.kind === kind && item.message === message,
        );
        if (existing) {
          const repeated: StackNotification = {
            ...existing,
            count: existing.count + 1,
            duration,
            updatedAt: now,
          };
          return {
            items: [
              repeated,
              ...state.items.filter((item) => item.id !== existing.id),
            ],
          };
        }
        const created: StackNotification = {
          id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
          kind,
          message,
          count: 1,
          duration,
          updatedAt: now,
        };
        return {
          items: [created, ...state.items].slice(0, MAX_NOTIFICATIONS),
        };
      }),
    dismiss: (id) =>
      set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
    cycle: () =>
      set((state) => {
        if (state.items.length < 2) return state;
        const [front, ...rest] = state.items;
        return { items: [...rest, front] };
      }),
  }),
);
