import { useMemo } from "react";
import { useAgentProfiles } from "#/hooks/query/use-agent-profiles";
import { useResolveTaskPlacements } from "#/hooks/use-resolve-task-placements";
import { useFeedFactoriesStore } from "#/stores/feed-factories-store";
import {
  FEED_FACTORIES,
  getConversationFactory,
  isFeedTeamDemoEnabled,
  toFeedFactory,
  type FactoryResolver,
  type FeedFactory,
} from "#/utils/feed-team-demo";

/**
 * The factories people created, plus the simulated ones only in
 * `?demoTeam=on` mode.
 */
export function useFeedFactories(): FeedFactory[] {
  const custom = useFeedFactoriesStore((state) => state.custom);
  const demo = isFeedTeamDemoEnabled(window.location.search);
  return useMemo(
    () => [...(demo ? FEED_FACTORIES : []), ...custom.map(toFeedFactory)],
    [custom, demo],
  );
}

/**
 * Resolves the factory of a conversation from saved placements and factory
 * membership. Re-created when placements, memberships or profiles change, so
 * lists that depend on it re-filter.
 */
export function useFactoryResolver(): FactoryResolver {
  useResolveTaskPlacements();
  const { data } = useAgentProfiles();
  const custom = useFeedFactoriesStore((state) => state.custom);
  const assignments = useFeedFactoriesStore((state) => state.assignments);
  const addedAgents = useFeedFactoriesStore((state) => state.addedAgents);
  return useMemo(() => {
    const names = new Map<string, string>();
    (data?.profiles ?? []).forEach((profile) => {
      if (profile.id) names.set(profile.id, profile.name);
    });
    // The store slices are read through getState; listing them here makes the
    // resolver change identity when any of them does.
    void custom;
    void assignments;
    void addedAgents;
    return (conversation) => getConversationFactory(conversation, names);
  }, [data, custom, assignments, addedAgents]);
}
