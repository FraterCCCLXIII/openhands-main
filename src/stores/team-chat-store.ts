import {
  create,
  type StateCreator,
  type StoreApi,
  type UseBoundStore,
} from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Account } from "#/chat-transport/nostr/keys";

export const DEFAULT_RELAY_URL = "ws://127.0.0.1:4869";

export type ReplyMode = "demo" | "openhands";

/** Where an agent request stands: acknowledged in the thread, or finished. */
export type RequestProgress = "acknowledged" | "done";

interface TeamRef {
  relayUrl: string;
  groupId: string;
  /** The display name last used, so signing back in with only the key keeps it. */
  name: string;
}

interface TeamChatState {
  /** Dev build: the secret key is kept in this browser's localStorage. */
  account: Account | null;
  relayUrl: string;
  groupId: string | null;
  /** The agents each person runs (by owner pubkey), each with its own key. */
  agentsByOwner: Record<string, Account[]>;
  /** How each agent answers once its owner approves. */
  replyModes: Record<string, ReplyMode>;
  /** Agent requests by `requestKey`, so each one is acknowledged and handled once. */
  requests: Record<string, RequestProgress>;
  /** The last team each person opened, so signing back in returns to it. */
  teamsByPubkey: Record<string, TeamRef>;
}

interface TeamChatActions {
  signIn: (account: Account, relayUrl: string) => void;
  openTeam: (groupId: string) => void;
  addAgent: (agent: Account) => void;
  setReplyMode: (agentPubkey: string, mode: ReplyMode) => void;
  setRequestProgress: (key: string, progress: RequestProgress) => void;
  /** Clears the signed-in account; the next sign-in with the same key finds its agents again. */
  signOut: () => void;
}

/**
 * Owns the team-chat session: who is signed in, which team is open, the agents they run
 * and which agent requests were handled. Components read from here; the actions are the
 * only writers.
 */
const initializer: StateCreator<TeamChatState & TeamChatActions> = (
  set,
  get,
) => ({
  account: null,
  relayUrl: DEFAULT_RELAY_URL,
  groupId: null,
  agentsByOwner: {},
  replyModes: {},
  requests: {},
  teamsByPubkey: {},
  signIn: (account, relayUrl) => {
    const last = get().teamsByPubkey[account.pubkey];
    set({
      account: { ...account, name: account.name || last?.name || "" },
      relayUrl: last?.relayUrl ?? relayUrl,
      groupId: last?.groupId ?? null,
    });
  },
  openTeam: (groupId) =>
    set((state) => ({
      groupId,
      teamsByPubkey: state.account
        ? {
            ...state.teamsByPubkey,
            [state.account.pubkey]: {
              relayUrl: state.relayUrl,
              groupId,
              name: state.account.name,
            },
          }
        : state.teamsByPubkey,
    })),
  addAgent: (agent) =>
    set((state) => {
      const owner = agent.ownerPubkey ?? "";
      const others = (state.agentsByOwner[owner] ?? []).filter(
        (a) => a.pubkey !== agent.pubkey,
      );
      return {
        agentsByOwner: {
          ...state.agentsByOwner,
          [owner]: [...others, agent],
        },
      };
    }),
  setReplyMode: (agentPubkey, mode) =>
    set((state) => ({
      replyModes: { ...state.replyModes, [agentPubkey]: mode },
    })),
  setRequestProgress: (key, progress) =>
    set((state) => ({ requests: { ...state.requests, [key]: progress } })),
  signOut: () => set({ account: null, groupId: null }),
});

export const useTeamChatStore = create<TeamChatState & TeamChatActions>()(
  persist(initializer, {
    name: "team-chat",
    storage: createJSONStorage(() => localStorage),
  }),
);

/**
 * A separate in-memory copy of the session for the sample team, so exploring it never
 * touches the saved account, agents or requests.
 */
export const createSampleTeamChatStore = (seed: Partial<TeamChatState>) =>
  create<TeamChatState & TeamChatActions>()((set, get, api) => ({
    ...initializer(set, get, api),
    ...seed,
  }));

export type TeamChatStoreHook = UseBoundStore<
  StoreApi<TeamChatState & TeamChatActions>
>;

const NO_AGENTS: Account[] = [];

/** Selector: the agents run by the signed-in person. */
export const selectMyAgents = (s: TeamChatState): Account[] =>
  s.agentsByOwner[s.account?.pubkey ?? ""] ?? NO_AGENTS;
