import type { AppConversation } from "#/api/conversation-service/agent-server-conversation-service.types";
import {
  FEED_DEMO_AGENTS,
  pickFeedDemoAgent,
  type FeedDemoAgent,
} from "#/utils/feed-demo-agents";
import { getFeedMetadata } from "#/utils/feed-metadata";
import type { RouteCandidate, RouteContext } from "#/utils/factory-routing";
import type { FactoryData } from "./use-factory-data";

/** The agent that routes every factory inbox. */
export const FACTORY_COORDINATOR: FeedDemoAgent =
  FEED_DEMO_AGENTS.find((agent) => agent.role === "conductor") ??
  FEED_DEMO_AGENTS[0];

export interface RosterAgent {
  agent: FeedDemoAgent;
  conversations: number;
  live: number;
}

/** The coordinator first, then every other agent working in the factory. */
export function buildRoster(data: FactoryData): {
  coordinator: RosterAgent;
  others: RosterAgent[];
} {
  const find = (name: string) =>
    data.agents.find((entry) => entry.agent.name === name);
  const toRoster = (agent: FeedDemoAgent): RosterAgent => ({
    agent,
    conversations: find(agent.name)?.conversations ?? 0,
    live: find(agent.name)?.live ?? 0,
  });
  return {
    coordinator: toRoster(FACTORY_COORDINATOR),
    others: data.agents
      .filter((entry) => entry.agent.name !== FACTORY_COORDINATOR.name)
      .map(({ agent }) => toRoster(agent)),
  };
}

const TICKET_KEY = /^[A-Z][A-Z0-9]+-\d+$/;

const toCandidate = (conversation: AppConversation): RouteCandidate => {
  const { pullRequests, tickets } = getFeedMetadata(conversation);
  return {
    id: conversation.id,
    title: conversation.title ?? "",
    agentName: pickFeedDemoAgent(conversation.id).name,
    pullRequests: pullRequests
      .map((pr) => pr.label.match(/\d+/)?.[0])
      .filter((n): n is string => !!n),
    tickets: tickets.map((t) => t.label).filter((l) => TICKET_KEY.test(l)),
  };
};

/** What the router needs to know about a factory. */
export function buildRouteContext(data: FactoryData): RouteContext {
  const { coordinator, others } = buildRoster(data);
  return {
    candidates: data.conversations.map(toCandidate),
    coordinator: { name: coordinator.agent.name, role: coordinator.agent.role },
    agents: [coordinator, ...others].map(({ agent }) => ({
      name: agent.name,
      role: agent.role,
    })),
  };
}
