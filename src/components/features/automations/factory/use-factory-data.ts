import { useMemo } from "react";
import type { AppConversation } from "#/api/conversation-service/agent-server-conversation-service.types";
import { useFeedConversations } from "#/hooks/use-feed-conversations";
import { ExecutionStatus } from "#/types/agent-server/core";
import {
  pickFeedDemoAgent,
  type FeedDemoAgent,
} from "#/utils/feed-demo-agents";
import { getFeedProject } from "#/utils/feed-filters";
import { getFeedFactory } from "#/utils/feed-team-demo";

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
): Omit<FactoryData, "isLoading"> {
  const conversations = all.filter(
    (conversation) => getFeedFactory(conversation.id).id === factoryId,
  );

  const agentsByName = new Map<string, FactoryAgentSummary>();
  const projectCounts = new Map<string, number>();
  conversations.forEach((conversation) => {
    const agent = pickFeedDemoAgent(conversation.id);
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
  return useMemo(
    () => ({ ...summarizeFactory(all, factoryId), isLoading }),
    [all, factoryId, isLoading],
  );
}
