import { useMemo } from "react";
import type { AppConversation } from "#/api/conversation-service/agent-server-conversation-service.types";
import { useFeedConversations } from "#/hooks/use-feed-conversations";
import { ExecutionStatus } from "#/types/agent-server/core";
import {
  pickFeedDemoAgent,
  type FeedDemoAgent,
} from "#/utils/feed-demo-agents";
import { getFeedProject } from "#/utils/feed-filters";
import { useAgentProfiles } from "#/hooks/query/use-agent-profiles";
import { useFactoryResolver } from "#/hooks/use-feed-factories";
import { useFeedAgentConfigStore } from "#/stores/feed-agent-config-store";
import { toFeedAgent } from "#/utils/feed-agent-identity";
import { getFeedAgent } from "#/utils/feed-agent";
import type { FactoryResolver } from "#/utils/feed-team-demo";
import { getConversationFactory } from "#/utils/feed-team-demo";

export interface FactoryAgentSummary {
  agent: FeedDemoAgent;
  conversations: number;
  live: number;
}

export interface FactoryProjectSummary {
  project: string;
  conversations: number;
}

export interface FactoryData {
  conversations: AppConversation[];
  live: number;
  agents: FactoryAgentSummary[];
  projects: FactoryProjectSummary[];
  /** ISO time of the newest conversation, or null with none. */
  lastActivity: string | null;
  isLoading: boolean;
}

const isLive = (conversation: AppConversation): boolean =>
  conversation.execution_status === ExecutionStatus.RUNNING;

/** The conversations in one simulated factory, rolled up for its page. */
export function summarizeFactory(
  all: AppConversation[],
  factoryId: string,
  resolveFactory: FactoryResolver = getConversationFactory,
  agentOf: (conversation: AppConversation) => FeedDemoAgent = (c) =>
    pickFeedDemoAgent(c.id),
): Omit<FactoryData, "isLoading"> {
  const conversations = all.filter(
    (conversation) => resolveFactory(conversation)?.id === factoryId,
  );

  const agentsByName = new Map<string, FactoryAgentSummary>();
  const projectCounts = new Map<string, number>();
  conversations.forEach((conversation) => {
    const agent = agentOf(conversation);
    const entry = agentsByName.get(agent.name) ?? {
      agent,
      conversations: 0,
      live: 0,
    };
    entry.conversations += 1;
    if (isLive(conversation)) entry.live += 1;
    agentsByName.set(agent.name, entry);

    const project = getFeedProject(conversation);
    if (project) {
      projectCounts.set(project, (projectCounts.get(project) ?? 0) + 1);
    }
  });

  return {
    conversations,
    live: conversations.filter(isLive).length,
    agents: [...agentsByName.values()].sort(
      (a, b) => b.conversations - a.conversations,
    ),
    projects: [...projectCounts.entries()]
      .map(([project, count]) => ({ project, conversations: count }))
      .sort((a, b) => b.conversations - a.conversations),
    lastActivity: conversations.reduce<string | null>(
      (latest, c) => (!latest || c.updated_at > latest ? c.updated_at : latest),
      null,
    ),
  };
}

/** The factory roll-up for the loaded conversations. */
export function useFactoryData(factoryId: string): FactoryData {
  const { conversations: all, isLoading } = useFeedConversations();
  const resolveFactory = useFactoryResolver();
  const { data } = useAgentProfiles();
  const configs = useFeedAgentConfigStore((state) => state.configs);
  return useMemo(() => {
    const profiles = new Map(
      (data?.profiles ?? []).map((profile) => [profile.id, profile]),
    );
    // The agent behind a conversation is the profile it was launched with.
    const agentOf = (conversation: AppConversation): FeedDemoAgent => {
      const profile = profiles.get(
        conversation.launched_agent_profile?.agent_profile_id ?? null,
      );
      return profile
        ? toFeedAgent(profile, configs[profile.name])
        : toFeedAgent({ name: getFeedAgent(conversation).name });
    };
    return {
      ...summarizeFactory(all, factoryId, resolveFactory, agentOf),
      isLoading,
    };
  }, [all, factoryId, isLoading, resolveFactory, data, configs]);
}
