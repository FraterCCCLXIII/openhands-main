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
  /** The pipeline template each factory uses, by factory id. */
  templates: Record<string, string>;
  /** Agents added to a factory by hand, by factory id (agent names). */
  addedAgents: Record<string, string[]>;
  /** The agent that coordinates a factory, when it is not the default. */
  coordinators: Record<string, string>;
}

interface FeedFactoriesActions {
  addFactory: (factory: CustomFactory) => void;
  assignConversation: (
    conversationId: string,
    assignment: ConversationAssignment,
  ) => void;
  setTemplate: (factoryId: string, templateId: string) => void;
  addAgent: (factoryId: string, agentName: string) => void;
  removeAgent: (factoryId: string, agentName: string) => void;
  setCoordinator: (factoryId: string, agentName: string) => void;
}

/** Owns the factories people add; every factory list reads from here. */
export const useFeedFactoriesStore = create<
  FeedFactoriesState & FeedFactoriesActions
>()(
  persist(
    (set) => ({
      custom: [],
      assignments: {},
      templates: {},
      addedAgents: {},
      coordinators: {},
      addAgent: (factoryId, agentName) =>
        set((state) => {
          const current = state.addedAgents[factoryId] ?? [];
          if (current.includes(agentName)) return state;
          return {
            addedAgents: {
              ...state.addedAgents,
              [factoryId]: [...current, agentName],
            },
          };
        }),
      removeAgent: (factoryId, agentName) =>
        set((state) => ({
          addedAgents: {
            ...state.addedAgents,
            [factoryId]: (state.addedAgents[factoryId] ?? []).filter(
              (name) => name !== agentName,
            ),
          },
        })),
      setCoordinator: (factoryId, agentName) =>
        set((state) => ({
          coordinators: { ...state.coordinators, [factoryId]: agentName },
        })),
      setTemplate: (factoryId, templateId) =>
        set((state) => ({
          templates: { ...state.templates, [factoryId]: templateId },
        })),
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
