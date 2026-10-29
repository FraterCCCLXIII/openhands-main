import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { FeedAgentRoleKey, FeedAgentTier } from "#/utils/feed-agent-role";

export interface FeedAgentConfig {
  role?: FeedAgentRoleKey;
  /** Null for no model (a role that runs none). */
  tier?: FeedAgentTier | null;
  skills?: string[];
  plugins?: string[];
  instructions?: string;
}

interface FeedAgentConfigState {
  /** What a person changed about a persona, by agent name. */
  configs: Record<string, FeedAgentConfig>;
}

interface FeedAgentConfigActions {
  setConfig: (agentName: string, patch: FeedAgentConfig) => void;
}

/**
 * Owns the settings a person edits for an agent in a factory: role, model
 * tier, skills, plugins and instructions. The writer is `setConfig`; the rail
 * and the edit dialog read from here.
 */
export const useFeedAgentConfigStore = create<
  FeedAgentConfigState & FeedAgentConfigActions
>()(
  persist(
    (set) => ({
      configs: {},
      setConfig: (agentName, patch) =>
        set((state) => ({
          configs: {
            ...state.configs,
            [agentName]: { ...state.configs[agentName], ...patch },
          },
        })),
    }),
    {
      name: "feed-agent-config",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
