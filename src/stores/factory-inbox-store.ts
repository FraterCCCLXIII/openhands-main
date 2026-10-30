import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { RouteReason } from "#/utils/factory-routing";

export interface FactoryInboxItem {
  id: string;
  factoryId: string;
  /** What was typed. */
  text: string;
  /** Where the request was aimed, as shown: "Factory inbox", an agent, a PR. */
  targetLabel: string;
  kind: "existing" | "new";
  agentName: string;
  conversationId: string | null;
  /** Title of the conversation it went to, when it was an existing one. */
  conversationTitle: string | null;
  reasons: RouteReason[];
  status: "sent" | "failed";
  createdAt: string;
}

interface FactoryInboxState {
  items: FactoryInboxItem[];
  /** When the Inbox tab was last viewed; later `sent` items count as new. */
  lastSeenAt: string | null;
}

interface FactoryInboxActions {
  addItem: (item: FactoryInboxItem) => void;
  /** The one writer of `lastSeenAt`: called when the Inbox tab is viewed. */
  markSeen: () => void;
  /** A temporary Cloud task id became the real conversation id. */
  replaceConversationId: (fromId: string, toId: string) => void;
}

/** Requests sent after the tab was last viewed, which the tab badge counts. */
export const countUnreadInboxItems = (
  items: FactoryInboxItem[],
  lastSeenAt: string | null,
): number =>
  items.filter(
    (item) =>
      item.status === "sent" && (!lastSeenAt || item.createdAt > lastSeenAt),
  ).length;

// Keeps the browser-local log bounded; the oldest requests fall off first.
const MAX_ITEMS = 100;

/** Owns the log of requests sent to factory inboxes and where each went. */
export const useFactoryInboxStore = create<
  FactoryInboxState & FactoryInboxActions
>()(
  persist(
    (set) => ({
      items: [],
      lastSeenAt: null,
      replaceConversationId: (fromId, toId) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.conversationId === fromId
              ? { ...item, conversationId: toId }
              : item,
          ),
        })),
      markSeen: () => set({ lastSeenAt: new Date().toISOString() }),
      addItem: (item) =>
        set((state) => ({ items: [...state.items, item].slice(-MAX_ITEMS) })),
    }),
    {
      name: "factory-inbox",
      version: 1,
      // Version 0 had no `lastSeenAt`: treat what it logged as already seen
      // rather than flooding the new badge.
      migrate: (persisted, version) => {
        const saved = persisted as FactoryInboxState;
        return version < 1
          ? { ...saved, lastSeenAt: new Date().toISOString() }
          : saved;
      },
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
