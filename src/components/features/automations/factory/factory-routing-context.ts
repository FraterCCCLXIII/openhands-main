import { Bot } from "lucide-react";
import { pickAgentTint } from "#/utils/feed-agent-identity";
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

/** Stands in as coordinator for a factory that has no agents of its own yet. */
const DEFAULT_COORDINATOR: FeedDemoAgent = {
  name: "OpenHands",
  role: "conductor",
  tier: null,
  Icon: Bot,
  className: pickAgentTint("OpenHands"),
};

export interface RosterAgent {
  agent: FeedDemoAgent;
  conversations: number;
  live: number;
}

export interface Roster {
  coordinator: RosterAgent;
  others: RosterAgent[];
}

/**
 * The coordinator first, then every other agent in the factory: those working
 * in its conversations and those added by hand. `coordinatorName` overrides
 * the default coordinator.
 */
export function buildRoster(
  data: FactoryData,
  addedNames: readonly string[] = [],
  coordinatorName?: string,
  knownAgents: readonly FeedDemoAgent[] = FEED_DEMO_AGENTS,
): Roster {
  const byName = (name: string) =>
    knownAgents.find((agent) => agent.name === name);
  const find = (name: string) =>
    data.agents.find((entry) => entry.agent.name === name);
  const toRoster = (agent: FeedDemoAgent): RosterAgent => ({
    agent,
    conversations: find(agent.name)?.conversations ?? 0,
    live: find(agent.name)?.live ?? 0,
  });

  const members = new Map<string, FeedDemoAgent>();
  data.agents.forEach(({ agent }) => members.set(agent.name, agent));
  addedNames.forEach((name) => {
    const agent = byName(name);
    if (agent) members.set(name, agent);
  });

  // The coordinator is the one chosen by hand, else a member playing the
  // conductor role, else the first member, else the default OpenHands agent.
  const memberList = [...members.values()];
  const coordinatorAgent =
    (coordinatorName ? byName(coordinatorName) : undefined) ??
    memberList.find((agent) => agent.role === "conductor") ??
    memberList[0] ??
    (knownAgents.includes(FACTORY_COORDINATOR)
      ? FACTORY_COORDINATOR
      : DEFAULT_COORDINATOR);
  members.delete(coordinatorAgent.name);

  return {
    coordinator: toRoster(coordinatorAgent),
    others: [...members.values()].map(toRoster),
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
export function buildRouteContext(
  data: FactoryData,
  { coordinator, others }: Roster,
): RouteContext {
  return {
    candidates: data.conversations.map(toCandidate),
    coordinator: { name: coordinator.agent.name, role: coordinator.agent.role },
    agents: [coordinator, ...others].map(({ agent }) => ({
      name: agent.name,
      role: agent.role,
    })),
  };
}
