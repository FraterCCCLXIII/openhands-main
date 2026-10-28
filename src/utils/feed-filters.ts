import { WORKSPACE_TAG_KEY } from "#/api/agent-server-adapter";
import type { AppConversation } from "#/api/conversation-service/agent-server-conversation-service.types";
import { getFeedFactory, getFeedTeammateIds } from "./feed-team-demo";

export interface FeedFilter {
  /** Project key from {@link getFeedProject}; null is every project. */
  project: string | null;
  /** AgentProfile id; null is every agent. */
  agentProfileId: string | null;
  /** Simulated factory id from the team demo; null is every factory. */
  factoryId: string | null;
  /** Simulated teammate id from the team demo; null is every teammate. */
  teammateId: string | null;
}

export const ALL_FEED_FILTER: FeedFilter = {
  project: null,
  agentProfileId: null,
  factoryId: null,
  teammateId: null,
};

const lastSegment = (path: string): string =>
  path.replace(/\/+$/, "").split("/").pop() ?? path;

// Where the runtime puts per-conversation worktrees. Such a path names the
// conversation, not the project, so it never labels a project.
const CONVERSATION_WORKTREES_SEGMENT = "/conversation-worktrees/";

/**
 * The project a conversation belongs to: its repository, else the folder the
 * user attached (recorded in the `workspace` tag or `selected_workspace`).
 * Null for conversations with neither, including ones that only ran in a
 * generated worktree.
 */
export function getFeedProject(conversation: AppConversation): string | null {
  if (conversation.selected_repository) return conversation.selected_repository;
  const dir = (
    conversation.tags?.[WORKSPACE_TAG_KEY] ?? conversation.selected_workspace
  )?.trim();
  if (!dir || dir.includes(CONVERSATION_WORKTREES_SEGMENT)) return null;
  return lastSegment(dir);
}

export function matchesFeedFilter(
  conversation: AppConversation,
  filter: FeedFilter,
): boolean {
  if (filter.project && getFeedProject(conversation) !== filter.project) {
    return false;
  }
  if (
    filter.agentProfileId &&
    conversation.launched_agent_profile?.agent_profile_id !==
      filter.agentProfileId
  ) {
    return false;
  }
  if (
    filter.factoryId &&
    getFeedFactory(conversation.id).id !== filter.factoryId
  ) {
    return false;
  }
  if (
    filter.teammateId &&
    !getFeedTeammateIds(conversation.id).includes(filter.teammateId)
  ) {
    return false;
  }
  return true;
}

/** Projects across the conversations with how many each holds, busiest first. */
export function countFeedProjects(
  conversations: AppConversation[],
): Array<{ project: string; count: number }> {
  const counts = new Map<string, number>();
  conversations.forEach((conversation) => {
    const project = getFeedProject(conversation);
    if (project) counts.set(project, (counts.get(project) ?? 0) + 1);
  });
  return [...counts.entries()]
    .map(([project, count]) => ({ project, count }))
    .sort((a, b) => b.count - a.count || a.project.localeCompare(b.project));
}

export function countFeedAgentProfiles(
  conversations: AppConversation[],
): Map<string, number> {
  const counts = new Map<string, number>();
  conversations.forEach((conversation) => {
    const id = conversation.launched_agent_profile?.agent_profile_id;
    if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
  });
  return counts;
}
