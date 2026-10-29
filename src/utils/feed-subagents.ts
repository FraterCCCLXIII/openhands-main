import type { AppConversation } from "#/api/conversation-service/agent-server-conversation-service.types";
import { ExecutionStatus } from "#/types/agent-server/core";

export interface FeedSubagentNode {
  conversation: AppConversation;
  parentId: string;
  /** 1 for a direct subagent of the card's conversation, 2 for its subagent, … */
  depth: number;
}

export interface FeedSubagentSummary {
  total: number;
  /** Deepest nesting level reached; 0 with no subagents. */
  levels: number;
  running: number;
}

export function summarizeSubagents(
  nodes: readonly FeedSubagentNode[],
): FeedSubagentSummary {
  return {
    total: nodes.length,
    levels: nodes.reduce((deepest, node) => Math.max(deepest, node.depth), 0),
    running: nodes.filter(
      (node) => node.conversation.execution_status === ExecutionStatus.RUNNING,
    ).length,
  };
}

/** Nodes ordered parent-before-children, so indenting by `depth` draws the tree. */
export function orderSubagentTree(
  nodes: readonly FeedSubagentNode[],
  rootId: string,
): FeedSubagentNode[] {
  const children = new Map<string, FeedSubagentNode[]>();
  nodes.forEach((node) => {
    children.set(node.parentId, [...(children.get(node.parentId) ?? []), node]);
  });
  const ordered: FeedSubagentNode[] = [];
  const visit = (parentId: string) => {
    (children.get(parentId) ?? []).forEach((node) => {
      ordered.push(node);
      visit(node.conversation.id);
    });
  };
  visit(rootId);
  return ordered;
}
