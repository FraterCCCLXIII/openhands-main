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
  /** `sending` is the optimistic entry shown while the request is in flight. */
  status: "sending" | "sent" | "failed";
  createdAt: string;
}

interface FactoryInboxState {
  items: FactoryInboxItem[];
  /** When every inbox was last marked seen; later requests count as unseen. */
  lastSeenAt: string | null;
  /** When one factory's inbox was last marked seen, by factory id. */
  seenByFactory: Record<string, string>;
}

interface FactoryInboxActions {
  addItem: (item: FactoryInboxItem) => void;
  /** Settles an optimistic entry once the request has been carried out. */
  updateItem: (id: string, patch: Partial<FactoryInboxItem>) => void;
  /**
   * The one writer of the seen markers, called from the open inbox view: one
   * factory's inbox, or every inbox when no factory is given.
   */
  markSeen: (factoryId?: string | null) => void;
  /** A temporary Cloud task id became the real conversation id. */
  replaceConversationId: (fromId: string, toId: string) => void;
}

type SeenMarkers = Pick<FactoryInboxState, "lastSeenAt" | "seenByFactory">;

/** Whether a request arrived after its factory's inbox was last marked seen. */
export const isUnseenInboxItem = (
  item: FactoryInboxItem,
  { lastSeenAt, seenByFactory }: SeenMarkers,
): boolean => {
  if (item.status === "failed") return false;
  const seen = [lastSeenAt, seenByFactory[item.factoryId]]
    .filter((marker): marker is string => !!marker)
    .sort()
    .at(-1);
  return !seen || item.createdAt > seen;
};

/** Unseen requests in one factory's inbox, or in all of them without an id. */
export const countUnseenInboxItems = (
  items: FactoryInboxItem[],
  markers: SeenMarkers,
  factoryId: string | null = null,
): number =>
  items.filter(
    (item) =>
      (!factoryId || item.factoryId === factoryId) &&
      isUnseenInboxItem(item, markers),
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
      seenByFactory: {},
      updateItem: (id, patch) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, ...patch } : item,
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
      markSeen: (factoryId) => {
        const now = new Date().toISOString();
        set((state) =>
          factoryId
            ? { seenByFactory: { ...state.seenByFactory, [factoryId]: now } }
            : { lastSeenAt: now, seenByFactory: {} },
        );
      },
      addItem: (item) =>
        set((state) => ({ items: [...state.items, item].slice(-MAX_ITEMS) })),
    }),
    {
      name: "factory-inbox",
      version: 2,
      // Version 0 had no `lastSeenAt`: treat what it logged as already seen
      // rather than flooding the new badge. Version 1 had no per-factory
      // markers, which start empty.
      migrate: (persisted, version) => {
        const saved = persisted as FactoryInboxState;
        const withSeen =
          version < 1
            ? { ...saved, lastSeenAt: new Date().toISOString() }
            : saved;
        return { ...withSeen, seenByFactory: withSeen.seenByFactory ?? {} };
      },
      // A request still in flight when the page closed will never settle.
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<FactoryInboxState>;
        return {
          ...current,
          ...saved,
          items: (saved.items ?? current.items).map((item) =>
            item.status === "sending"
              ? { ...item, status: "failed" as const }
              : item,
          ),
        };
      },
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
