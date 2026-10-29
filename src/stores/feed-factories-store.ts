import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/** A factory someone created, saved beside the built-in simulated ones. */
export interface CustomFactory {
  id: string;
  name: string;
  description: string;
  /** Id of the simulated teammate who owns it. */
  ownerId: string;
}

/** A conversation placed in a factory with an agent, overriding the default. */
export interface ConversationAssignment {
  factoryId: string;
  agentName: string;
}

interface FeedFactoriesState {
  custom: CustomFactory[];
  /** Conversations the factory inbox started or placed, by conversation id. */
  assignments: Record<string, ConversationAssignment>;
}

interface FeedFactoriesActions {
  addFactory: (factory: CustomFactory) => void;
  assignConversation: (
    conversationId: string,
    assignment: ConversationAssignment,
  ) => void;
}

/** Owns the factories people add; every factory list reads from here. */
export const useFeedFactoriesStore = create<
  FeedFactoriesState & FeedFactoriesActions
>()(
  persist(
    (set) => ({
      custom: [],
      assignments: {},
      addFactory: (factory) =>
        set((state) => ({ custom: [...state.custom, factory] })),
      assignConversation: (conversationId, assignment) =>
        set((state) => ({
          assignments: { ...state.assignments, [conversationId]: assignment },
        })),
    }),
    {
      name: "feed-factories",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
