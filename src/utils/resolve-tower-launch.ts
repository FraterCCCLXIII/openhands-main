import { WELL_KNOWN_DEFAULT_AGENT_PROFILE_NAME } from "#/api/agent-profiles-service/agent-profiles-service.api";
import type { AgentProfileSummary } from "#/api/agent-profiles-service/agent-profiles-service.api";

/** Which choice produced the agent a Tower message goes to. */
export type TowerLaunchSource =
  /** The user picked a specific agent profile. */
  | "picked"
  /** The selected factory's conductor. */
  | "conductor"
  /** No conductor profile; the active agent profile stands in. */
  | "active"
  /** No conductor or active profile; the default OpenHands profile. */
  | "default"
  /** Nothing to resolve; the server's own default applies. */
  | "none";

export interface TowerLaunch {
  profile: AgentProfileSummary | null;
  source: TowerLaunchSource;
}

interface ResolveTowerLaunchInput {
  profiles: readonly AgentProfileSummary[];
  /** A profile id the user picked, or null for "Conductor" / automatic. */
  pickedProfileId: string | null;
  /** The selected factory's conductor profile id, when it has a real one. */
  conductorProfileId: string | null;
  /** Whether a factory (not "All") is the destination. */
  hasFactory: boolean;
  activeProfileId: string | null;
}

const byId = (profiles: readonly AgentProfileSummary[], id: string | null) =>
  id ? (profiles.find((p) => p.id === id) ?? null) : null;

/**
 * The agent profile that receives a message sent from the Tower: the one the
 * user picked, else the factory's conductor, else the active profile, else the
 * default OpenHands profile. `source` says which, so a fallback can be named.
 */
export function resolveTowerLaunch({
  profiles,
  pickedProfileId,
  conductorProfileId,
  hasFactory,
  activeProfileId,
}: ResolveTowerLaunchInput): TowerLaunch {
  const picked = byId(profiles, pickedProfileId);
  if (picked) return { profile: picked, source: "picked" };

  const conductor = hasFactory ? byId(profiles, conductorProfileId) : null;
  if (conductor) return { profile: conductor, source: "conductor" };

  const active = byId(profiles, activeProfileId);
  if (active) return { profile: active, source: "active" };

  const fallback = profiles.find(
    (p) => p.name === WELL_KNOWN_DEFAULT_AGENT_PROFILE_NAME,
  );
  if (fallback) return { profile: fallback, source: "default" };
  return { profile: null, source: "none" };
}
