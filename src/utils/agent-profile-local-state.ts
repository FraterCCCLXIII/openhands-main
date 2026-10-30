import { useFeedAgentConfigStore } from "#/stores/feed-agent-config-store";
import { useFeedFactoriesStore } from "#/stores/feed-factories-store";
import { useFeedIconsStore } from "#/stores/feed-icons-store";
import { agentIconKey } from "./feed-icon-keys";

/**
 * The only place that keeps the app's saved state about agent profiles in step
 * with the Agent Server's profile list. The mutation hooks call these after the
 * server accepts a rename or delete, so every screen (Agents page, Settings,
 * factories, the Feed) ends in the same state.
 */

/** Moves a profile's attributes and factory memberships to its new name. */
export function renameAgentProfileLocalState(from: string, to: string): void {
  useFeedAgentConfigStore.getState().renameAgent(from, to);
  useFeedFactoriesStore.getState().renameAgent(from, to);
}

/** Forgets a deleted profile: its attributes, icon and factory memberships. */
export function forgetAgentProfileLocalState(
  name: string,
  profileId?: string | null,
): void {
  useFeedAgentConfigStore.getState().forgetAgent(name);
  useFeedFactoriesStore.getState().forgetAgent(name);
  if (profileId) {
    useFeedIconsStore.getState().setIcon(agentIconKey(profileId), {});
  }
}
