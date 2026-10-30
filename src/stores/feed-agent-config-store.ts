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
  /** What the agent is for, in the owner's words. */
  description?: string;
  /** Avatar tint, a key of `FEED_AGENT_COLORS`. */
  color?: string;
}

interface FeedAgentConfigState {
  /**
   * What a person set about an agent profile beyond what the Agent Server
   * stores (name, kind, model, instructions): role, description, colour, tier,
   * skills and plugins. Keyed by profile name.
   */
  configs: Record<string, FeedAgentConfig>;
}

interface FeedAgentConfigActions {
  setConfig: (agentName: string, patch: FeedAgentConfig) => void;
  /** Moves a profile's saved attributes to its new name. */
  renameAgent: (from: string, to: string) => void;
  /** Drops a deleted profile's saved attributes. */
  forgetAgent: (agentName: string) => void;
}

/**
 * Owns the presentation attributes of agent profiles: role, model tier,
 * description, colour, skills, plugins and instructions. The Agent Server owns
 * the profile itself (its existence, name, kind and model); this store only
 * decorates it. The writers are `setConfig`, `renameAgent` and `forgetAgent`;
 * every agent view reads from here.
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
      renameAgent: (from, to) =>
        set((state) => {
          if (from === to || !state.configs[from]) return state;
          const { [from]: moved, ...rest } = state.configs;
          return { configs: { ...rest, [to]: moved } };
        }),
      forgetAgent: (agentName) =>
        set((state) => {
          if (!state.configs[agentName]) return state;
          const { [agentName]: _removed, ...rest } = state.configs;
          return { configs: rest };
        }),
    }),
    {
      name: "feed-agent-config",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Version 0 had the same shape; hydrate defensively so a damaged or
      // older blob still yields a valid, possibly empty, map.
      migrate: (persisted) => {
        const configs = (persisted as Partial<FeedAgentConfigState> | null)
          ?.configs;
        return {
          configs:
            configs && typeof configs === "object" && !Array.isArray(configs)
              ? configs
              : {},
        } as FeedAgentConfigState & FeedAgentConfigActions;
      },
    },
  ),
);
