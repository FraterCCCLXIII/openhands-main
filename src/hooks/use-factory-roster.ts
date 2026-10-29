import { useMemo } from "react";
import {
  buildRoster,
  type Roster,
} from "#/components/features/automations/factory/factory-routing-context";
import type { FactoryData } from "#/components/features/automations/factory/use-factory-data";
import { useFeedFactoriesStore } from "#/stores/feed-factories-store";

const NO_AGENTS: readonly string[] = [];

/** A factory's roster: its coordinator and agents, with the hand-made changes applied. */
export function useFactoryRoster(factoryId: string, data: FactoryData): Roster {
  const added = useFeedFactoriesStore(
    (state) => state.addedAgents[factoryId] ?? NO_AGENTS,
  );
  const coordinator = useFeedFactoriesStore(
    (state) => state.coordinators[factoryId],
  );
  return useMemo(
    () => buildRoster(data, added, coordinator),
    [data, added, coordinator],
  );
}
