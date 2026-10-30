import { useMemo } from "react";
import { useAgentProfiles } from "#/hooks/query/use-agent-profiles";
import { useFeedAgentConfigStore } from "#/stores/feed-agent-config-store";
import { toFeedAgent } from "#/utils/feed-agent-identity";
import { FEED_DEMO_AGENTS, type FeedDemoAgent } from "#/utils/feed-demo-agents";
import { isFeedTeamDemoEnabled } from "#/utils/feed-team-demo";

/**
 * Every agent a factory can have as a member: the real agent profiles with
 * their saved attributes, plus the simulated personas only in `?demoTeam=on`.
 */
export function useKnownFeedAgents(): FeedDemoAgent[] {
  const { data } = useAgentProfiles();
  const configs = useFeedAgentConfigStore((state) => state.configs);
  const demo = isFeedTeamDemoEnabled(window.location.search);
  return useMemo(
    () => [
      ...(data?.profiles ?? []).map((profile) =>
        toFeedAgent(profile, configs[profile.name]),
      ),
      ...(demo ? FEED_DEMO_AGENTS : []),
    ],
    [data, configs, demo],
  );
}
