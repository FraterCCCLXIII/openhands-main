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
}

interface FactoryInboxActions {
  addItem: (item: FactoryInboxItem) => void;
}

// Keeps the browser-local log bounded; the oldest requests fall off first.
const MAX_ITEMS = 100;

/** Owns the log of requests sent to factory inboxes and where each went. */
export const useFactoryInboxStore = create<
  FactoryInboxState & FactoryInboxActions
>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => ({ items: [...state.items, item].slice(-MAX_ITEMS) })),
    }),
    {
      name: "factory-inbox",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
