import { create } from "zustand";

interface TeamChatUiState {
  /** A person to @mention in the composer, set from a profile; the composer clears it once used. */
  mention: { name: string; nonce: number } | null;
  requestMention: (name: string) => void;
  clearMention: () => void;
}

/** Owns small bits of team-chat screen state that two components share: the composer and the profile. */
export const useTeamChatUiStore = create<TeamChatUiState>()((set) => ({
  mention: null,
  requestMention: (name) => set({ mention: { name, nonce: Date.now() } }),
  clearMention: () => set({ mention: null }),
}));
