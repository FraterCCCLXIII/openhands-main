import { create } from "zustand";

/** Where the team switcher asked the signed-out/no-team screen to land. */
export type TeamEntryIntent = "start" | "join" | "sample";

interface TeamEntryState {
  intent: TeamEntryIntent | null;
  setIntent: (intent: TeamEntryIntent | null) => void;
}

/**
 * A one-shot hand-off, never persisted: the team switcher leaves the open team and says
 * which screen to show next (the sample, or the create/join form on a given tab). The
 * screen that consumes it clears it.
 */
export const useTeamEntryStore = create<TeamEntryState>()((set) => ({
  intent: null,
  setIntent: (intent) => set({ intent }),
}));
