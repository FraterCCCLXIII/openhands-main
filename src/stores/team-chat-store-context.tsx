import { createContext, useContext } from "react";
import {
  useTeamChatStore,
  type TeamChatStoreHook,
} from "#/stores/team-chat-store";

const TeamChatStoreContext = createContext<TeamChatStoreHook>(useTeamChatStore);

/** Gives the team screens a different session store, such as the in-memory sample team. */
export const TeamChatStoreProvider = TeamChatStoreContext.Provider;

/** Reads from the session store in scope: the saved one, or the sample team's. */
export function useTeamStore<T>(
  selector: (state: ReturnType<TeamChatStoreHook["getState"]>) => T,
): T {
  const store = useContext(TeamChatStoreContext);
  return store(selector);
}
