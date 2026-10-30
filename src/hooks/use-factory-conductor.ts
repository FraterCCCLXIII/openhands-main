import { useFactoryData } from "#/components/features/automations/factory/use-factory-data";
import { useFactoryRoster } from "#/hooks/use-factory-roster";

export interface FactoryConductor {
  name: string;
  /** Set only when the conductor is a real agent profile. */
  profileId: string | null;
}

/**
 * The agent that coordinates a factory: the one chosen by hand, else a member
 * playing the conductor role, else the default OpenHands agent (which has no
 * profile of its own, so `profileId` is null).
 */
export function useFactoryConductor(
  factoryId: string | null,
): FactoryConductor | null {
  const data = useFactoryData(factoryId ?? "");
  const { coordinator } = useFactoryRoster(factoryId ?? "", data);
  if (!factoryId) return null;
  return {
    name: coordinator.agent.name,
    profileId: coordinator.agent.profileId ?? null,
  };
}
